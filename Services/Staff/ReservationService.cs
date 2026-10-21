using RestaurantMvc.Data;
using RestaurantMvc.Models;
using RestaurantMvc.Infrastructure;
namespace RestaurantMvc.Services.Staff;
public class ReservationService(RestaurantDb db)
{
    public async Task<dynamic> LockTable(int tableId)
    {
        var row=await db.One("SELECT * FROM RestaurantTables WITH(UPDLOCK,HOLDLOCK) WHERE id=@tableId",new {tableId});
        if(row==null) throw new BusinessException("Không tìm thấy bàn.",404); return row;
    }
    public Task<List<dynamic>> Tables() => db.Query("""
        SELECT t.*, CASE WHEN t.enabled=0 THEN 'disabled' WHEN s.id IS NOT NULL THEN 'occupied'
        WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.tableId=t.id AND r.status IN ('pending','confirmed') AND r.startAt<=DATEADD(minute,30,SYSUTCDATETIME()) AND r.endAt>SYSUTCDATETIME()) THEN 'reserved' ELSE 'free' END status,
        s.id sessionId,s.status sessionStatus FROM RestaurantTables t LEFT JOIN DiningSessions s ON s.tableId=t.id AND s.closedAt IS NULL ORDER BY t.id
        """);
    public Task<dynamic> AddTable(TableInput b) => db.One("INSERT RestaurantTables(code,capacity) OUTPUT inserted.* VALUES(@code,@capacity)", new {code=Rules.Text(b.Code,"Mã bàn",20),capacity=b.Capacity});
    public async Task<dynamic> EditTable(int id,TableInput b)
    {
        var code=Rules.Text(b.Code,"Mã bàn",20); Rules.Require(b.Enabled!=null,"Trạng thái bàn không hợp lệ.");
        return await db.Atomic<dynamic>(async()=>{
            await LockTable(id);
            if(await db.One("SELECT id FROM DiningSessions WHERE tableId=@id AND closedAt IS NULL",new {id})!=null) throw new BusinessException("Bàn đang có khách. Kết thúc lượt phục vụ trước khi sửa.",409);
            var schedule=await db.Query("SELECT guests FROM Reservations WHERE tableId=@id AND status IN ('pending','confirmed') AND endAt>SYSUTCDATETIME()",new {id});
            if(schedule.Any(r=>b.Enabled==false || (int)r.guests>b.Capacity)) throw new BusinessException("Còn lịch đặt hiệu lực. Xử lý lịch trước khi giảm sức chứa hoặc ngừng phục vụ.",409);
            return await db.One("UPDATE RestaurantTables SET code=@code,capacity=@Capacity,enabled=@Enabled OUTPUT inserted.* WHERE id=@id",new {id,code,b.Capacity,b.Enabled});
        });
    }
    public Task<List<dynamic>> Availability(DateTimeOffset when,int guests)
    {
        Rules.Require(guests>=1 && guests<=30,"Số khách từ 1 đến 30."); var startAt=Rules.Schedule(when);
        return db.Query("""
            SELECT t.* FROM RestaurantTables t WHERE enabled=1 AND capacity>=@guests
            AND NOT EXISTS(SELECT 1 FROM Reservations r WHERE r.tableId=t.id AND r.status IN ('pending','confirmed') AND r.startAt<@endAt AND r.endAt>@startAt)
            AND NOT EXISTS(SELECT 1 FROM DiningSessions s JOIN Reservations r ON r.id=s.reservationId WHERE s.tableId=t.id AND s.closedAt IS NULL
            AND @startAt<CASE WHEN r.endAt>SYSUTCDATETIME() THEN r.endAt ELSE DATEADD(hour,2,SYSUTCDATETIME()) END) ORDER BY capacity,id
            """,new {guests,startAt,endAt=startAt.AddHours(2)});
    }
    public Task<List<dynamic>> List(Actor actor) => db.Query($"SELECT r.*,t.code tableCode FROM Reservations r JOIN RestaurantTables t ON t.id=r.tableId {(actor.Role=="customer"?"WHERE r.userId=@id":"")} ORDER BY r.startAt DESC,r.id DESC",new {id=actor.Id});
    public async Task<dynamic> Book(Actor actor,ReservationInput b)
    {
        var startAt=Rules.Schedule(b.StartAt);
        var data=new {userId=actor.Id,tableId=b.TableId,name=Rules.Text(b.Name,"Tên khách"),phone=Rules.Phone(b.Phone),guests=b.Guests,note=Rules.Text(b.Note,"Ghi chú",500,false),startAt,endAt=startAt.AddHours(2)};
        return await db.Atomic<dynamic>(async()=>{
            var table=await LockTable(b.TableId);
            Rules.Require((bool)table.enabled && (int)table.capacity>=b.Guests,"Bàn không phù hợp với số khách.");
            var conflict=await db.One("SELECT id FROM Reservations WHERE tableId=@tableId AND status IN ('pending','confirmed') AND startAt<@endAt AND endAt>@startAt",data);
            var active=await db.One("""
                SELECT s.id FROM DiningSessions s JOIN Reservations r ON r.id=s.reservationId WHERE s.tableId=@tableId AND s.closedAt IS NULL
                AND @startAt<CASE WHEN r.endAt>SYSUTCDATETIME() THEN r.endAt ELSE DATEADD(hour,2,SYSUTCDATETIME()) END
                """,data);
            if(conflict!=null || active!=null) throw new BusinessException("Bàn vừa được đặt hoặc đang phục vụ. Vui lòng chọn bàn khác.",409);
            return await db.One("INSERT Reservations(userId,tableId,name,phone,guests,startAt,endAt,note) OUTPUT inserted.* VALUES(@userId,@tableId,@name,@phone,@guests,@startAt,@endAt,@note)",data);
        });
    }
    public async Task<dynamic> Change(Actor actor,int id,StatusInput b)
    {
        Rules.Require(b.Status is "confirmed" or "cancelled","Trạng thái đặt bàn không hợp lệ.");
        Rules.Require(b.Status!="confirmed" || actor.Role!="customer","Chỉ nhân viên có thể xác nhận.",403);
        var reason=b.Status=="cancelled"?Rules.Text(b.Reason,"Lý do hủy",300):null;
        return await db.Atomic<dynamic>(async()=>{
            var lookup=await db.One("SELECT tableId FROM Reservations WHERE id=@id",new {id});
            if(lookup==null) throw new BusinessException("Không tìm thấy đặt bàn.",404);
            await LockTable((int)lookup.tableId);
            var r=await db.One("SELECT * FROM Reservations WITH(UPDLOCK) WHERE id=@id",new {id});
            Rules.Require(actor.Role!="customer" || (int)r.userId==actor.Id,"Không có quyền xem đặt bàn này.",403);
            Rules.Require((string)r.status is "pending" or "confirmed","Đặt bàn đã hủy hoặc đã nhận bàn.",409);
            if(b.Status=="confirmed") Rules.Require((string)r.status=="pending" && (DateTime)r.endAt>=DateTime.UtcNow,"Không thể xác nhận lịch này.",409);
            return await db.One("UPDATE Reservations SET status=@Status,cancelReason=@reason OUTPUT inserted.* WHERE id=@id",new {id,b.Status,reason});
        });
    }
    public Task<dynamic> Seat(int id) => db.Atomic<dynamic>(async()=>{
        var lookup=await db.One("SELECT tableId FROM Reservations WHERE id=@id",new {id});
        if(lookup==null) throw new BusinessException("Không tìm thấy đặt bàn.",404);
        await LockTable((int)lookup.tableId);
        var r=await db.One("SELECT * FROM Reservations WITH(UPDLOCK) WHERE id=@id",new {id});
        var existing=await db.One("SELECT * FROM DiningSessions WHERE reservationId=@id",new {id}); if(existing!=null) return existing;
        Rules.Require((string)r.status=="confirmed","Cần xác nhận đặt bàn trước khi nhận bàn.",409);
        Rules.Require(DateTime.UtcNow>=((DateTime)r.startAt).AddMinutes(-30) && DateTime.UtcNow<(DateTime)r.endAt,"Chỉ nhận bàn từ 30 phút trước giờ đặt đến trước giờ kết thúc.",409);
        if(await db.One("SELECT id FROM DiningSessions WHERE tableId=@tableId AND closedAt IS NULL",new {tableId=(int)r.tableId})!=null) throw new BusinessException("Bàn đang có lượt phục vụ khác.",409);
        var s=await db.One("INSERT DiningSessions(tableId,reservationId,userId) OUTPUT inserted.* VALUES(@tableId,@id,@userId)",new {tableId=(int)r.tableId,id,userId=(int)r.userId});
        await db.Query("UPDATE Reservations SET status='seated' WHERE id=@id",new {id}); return s;
    });
}


