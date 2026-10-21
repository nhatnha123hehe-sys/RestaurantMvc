using RestaurantMvc.Data;
using RestaurantMvc.Models;
using RestaurantMvc.Infrastructure;
using System.Text.RegularExpressions;
namespace RestaurantMvc.Services.Staff;
public class OrderService(RestaurantDb db,ReservationService reservations)
{
    private async Task<dynamic> OwnSession(Actor actor,int id,bool locked=false)
    {
        var s=await db.One($"SELECT * FROM DiningSessions {(locked?"WITH(UPDLOCK,HOLDLOCK)":"")} WHERE id=@id",new {id});
        if(s==null) throw new BusinessException("Không tìm thấy lượt bàn.",404);
        Rules.Require(actor.Role!="customer" || (int)s.userId==actor.Id,"Bạn không có quyền truy cập lượt bàn này.",403); return s;
    }
    public Task<List<dynamic>> Sessions(Actor actor) => db.Query($"""
        SELECT s.*,t.code tableCode,r.name customerName,r.guests,i.id invoiceId,i.total,i.status invoiceStatus
        FROM DiningSessions s JOIN RestaurantTables t ON t.id=s.tableId JOIN Reservations r ON r.id=s.reservationId LEFT JOIN Invoices i ON i.sessionId=s.id
        {(actor.Role=="customer"?"WHERE s.userId=@id":"")} ORDER BY s.id DESC
        """,new {id=actor.Id});
    public async Task<List<dynamic>> Orders(Actor actor,int? sessionId=null)
    {
        if(sessionId!=null) await OwnSession(actor,sessionId.Value);
        var orders=await db.Query(sessionId!=null ? "SELECT * FROM Orders WHERE sessionId=@sessionId ORDER BY id DESC" : "SELECT o.*,t.code tableCode,r.name customerName FROM Orders o JOIN DiningSessions s ON s.id=o.sessionId JOIN RestaurantTables t ON t.id=s.tableId JOIN Reservations r ON r.id=s.reservationId ORDER BY o.id DESC",new {sessionId});
        var items=await db.Query("SELECT oi.* FROM OrderItems oi JOIN Orders o ON o.id=oi.orderId WHERE @sessionId IS NULL OR o.sessionId=@sessionId",new {sessionId});
        foreach(var order in orders) ((IDictionary<string,object>)order)["items"]=items.Where(i=>(int)i.orderId==(int)order.id).ToList();
        return orders;
    }
    public async Task<dynamic> Place(Actor actor,OrderInput b)
    {
        var key=Rules.Text(b.RequestKey,"Mã yêu cầu",80);
        Rules.Require(Regex.IsMatch(key,@"^[a-zA-Z0-9-]{16,80}$"),"Mã yêu cầu không hợp lệ.");
        var note=Rules.Text(b.Note,"Ghi chú",500,false);
        Rules.Require(b.Items.All(i=>i!=null) && b.Items.Select(i=>i.DishId).Distinct().Count()==b.Items.Count,"Giỏ hàng có món trùng hoặc không hợp lệ.");
        return await db.Atomic<dynamic>(async()=>{
            var s=await OwnSession(actor,b.SessionId,true);
            var existing=await db.One("SELECT * FROM Orders WHERE userId=@userId AND requestKey=@key",new {userId=actor.Id,key});
            if(existing!=null) { Rules.Require((int)existing.sessionId==b.SessionId,"Mã yêu cầu đã dùng cho lượt bàn khác.",409); return existing; }
            Rules.Require((string)s.status=="open","Lượt bàn đã chốt hóa đơn hoặc kết thúc, không thể gọi thêm món.",409);
            var checkedItems=new List<(OrderItemInput Item,string Name)>();
            foreach(var item in b.Items.OrderBy(i=>i.DishId)) {
                var dish=await db.One("SELECT * FROM Dishes WITH(HOLDLOCK) WHERE id=@DishId",item);
                if(dish is null) throw new BusinessException("Không tìm thấy món.",409);
                if(!(bool)dish.visible || !(bool)dish.available) throw new BusinessException("Một món đã hết hoặc ngừng phục vụ. Vui lòng cập nhật giỏ.",409);
                Rules.Require((int)dish.price==item.UnitPrice,$"Giá {dish.name} đã đổi. Cập nhật giỏ rồi xác nhận lại.",409);
                checkedItems.Add((item,(string)dish.name));
            }
            var order=await db.One("INSERT Orders(sessionId,userId,requestKey,note) OUTPUT inserted.* VALUES(@SessionId,@userId,@key,@note)",new {b.SessionId,userId=actor.Id,key,note});
            foreach(var (item,name) in checkedItems) await db.Query("INSERT OrderItems(orderId,dishId,dishName,quantity,unitPrice) VALUES(@orderId,@DishId,@name,@Quantity,@UnitPrice)",new {orderId=(int)order.id,item.DishId,name,item.Quantity,item.UnitPrice});
            return order;
        });
    }
    public async Task<dynamic> Change(Actor actor,int id,StatusInput b)
    {
        Rules.Require(b.Status is "preparing" or "served" or "cancelled","Trạng thái không hợp lệ.");
        var reason=b.Status=="cancelled"?Rules.Text(b.Reason,"Lý do hủy",300):null;
        return await db.Atomic<dynamic>(async()=>{
            var lookup=await db.One("SELECT sessionId FROM Orders WHERE id=@id",new {id}); if(lookup==null) throw new BusinessException("Không tìm thấy đơn.",404);
            var s=await OwnSession(actor,(int)lookup.sessionId,true);
            Rules.Require((string)s.status=="open","Lượt bàn đã chốt hóa đơn.",409);
            var order=await db.One("SELECT * FROM Orders WITH(UPDLOCK) WHERE id=@id",new {id});
            var valid=(string)order.status=="pending" && (b.Status is "preparing" or "cancelled") || (string)order.status=="preparing" && b.Status=="served";
            Rules.Require(valid,"Chuyển trạng thái không hợp lệ.",409);
            return await db.One("UPDATE Orders SET status=@Status,cancelReason=@reason OUTPUT inserted.* WHERE id=@id",new {id,b.Status,reason});
        });
    }
    public Task<dynamic> Invoice(Actor actor,int sessionId) => db.Atomic<dynamic>(async()=>{
        var s=await OwnSession(actor,sessionId,true);
        var existing=await db.One("SELECT * FROM Invoices WHERE sessionId=@sessionId",new {sessionId}); if(existing!=null) return existing;
        Rules.Require((string)s.status=="open","Lượt bàn đã kết thúc.",409);
        if(await db.One("SELECT id FROM Orders WHERE sessionId=@sessionId AND status IN ('pending','preparing')",new {sessionId})!=null) throw new BusinessException("Cần phục vụ hoặc hủy các đơn đang xử lý trước khi lập hóa đơn.",409);
        var sum=await db.One("SELECT COALESCE(SUM(oi.quantity*oi.unitPrice),0) total FROM OrderItems oi JOIN Orders o ON o.id=oi.orderId WHERE o.sessionId=@sessionId AND o.status='served'",new {sessionId});
        var invoice=await db.One("INSERT Invoices(sessionId,total) OUTPUT inserted.* VALUES(@sessionId,@total)",new {sessionId,total=(int)sum.total});
        await db.Query("UPDATE DiningSessions SET status='billing' WHERE id=@sessionId",new {sessionId}); return invoice;
    });
    public Task<List<dynamic>> Invoices(Actor actor) => db.Query($"""
        SELECT i.*,t.code tableCode,r.name customerName FROM Invoices i JOIN DiningSessions s ON s.id=i.sessionId JOIN RestaurantTables t ON t.id=s.tableId JOIN Reservations r ON r.id=s.reservationId
        {(actor.Role=="customer"?"WHERE s.userId=@id":"")} ORDER BY i.id DESC
        """,new {id=actor.Id});
    public async Task<dynamic> Detail(Actor actor,int id)
    {
        var invoice=await db.One("SELECT i.*,t.code tableCode,r.name customerName,r.phone,s.userId FROM Invoices i JOIN DiningSessions s ON s.id=i.sessionId JOIN RestaurantTables t ON t.id=s.tableId JOIN Reservations r ON r.id=s.reservationId WHERE i.id=@id",new {id});
        if(invoice==null) throw new BusinessException("Không tìm thấy hóa đơn.",404);
        await OwnSession(actor,(int)invoice.sessionId);
        ((IDictionary<string,object>)invoice)["items"]=await db.Query("SELECT oi.* FROM OrderItems oi JOIN Orders o ON o.id=oi.orderId WHERE o.sessionId=@sessionId AND o.status='served' ORDER BY oi.id",new {sessionId=(int)invoice.sessionId});
        return invoice;
    }
    public async Task<dynamic> Pay(Actor actor,int id,PaymentInput b)
    {
        Rules.Require(b.Method is "cash" or "transfer","Chọn thanh toán tiền mặt hoặc chuyển khoản.");
        return await db.Atomic<dynamic>(async()=>{
            var lookup=await db.One("SELECT s.tableId,i.sessionId FROM Invoices i JOIN DiningSessions s ON s.id=i.sessionId WHERE i.id=@id",new {id}); if(lookup==null) throw new BusinessException("Không tìm thấy hóa đơn.",404);
            await reservations.LockTable((int)lookup.tableId); await OwnSession(actor,(int)lookup.sessionId,true);
            var invoice=await db.One("SELECT * FROM Invoices WITH(UPDLOCK) WHERE id=@id",new {id}); if((string)invoice.status=="paid") return invoice;
            var paid=await db.One("UPDATE Invoices SET status='paid',method=@Method,paidAt=SYSUTCDATETIME(),paidBy=@userId OUTPUT inserted.* WHERE id=@id",new {id,b.Method,userId=actor.Id});
            await db.Query("UPDATE DiningSessions SET status='closed',closedAt=SYSUTCDATETIME() WHERE id=@sessionId",new {sessionId=(int)lookup.sessionId}); return paid;
        });
    }
}


