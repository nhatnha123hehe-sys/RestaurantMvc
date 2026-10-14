using RestaurantMvc.Data;
using RestaurantMvc.Models;
using RestaurantMvc.Infrastructure;

namespace RestaurantMvc.Services;

public class SupportService(RestaurantDb db)
{
    private static string Clean(string value) => Rules.Text(value, "Tin nhắn", 500);

    private async Task<dynamic> OpenConversation(int customerId)
    {
        var conversation = await db.One("SELECT TOP 1 * FROM SupportConversations WHERE customerId=@customerId AND status='open' ORDER BY id DESC", new { customerId });
        return conversation ?? await db.One("INSERT SupportConversations(customerId) OUTPUT inserted.* VALUES(@customerId)", new { customerId });
    }

    private async Task<List<dynamic>> Messages(int id)
        => await db.Query("SELECT m.id,m.conversationId,m.senderId,m.senderRole,m.message,m.createdAt,u.name senderName FROM SupportMessages m JOIN Users u ON u.id=m.senderId WHERE m.conversationId=@id ORDER BY m.id", new { id });

    public async Task<dynamic?> CustomerConversation(Actor actor)
    {
        Rules.Require(actor.Role == "customer", "Chỉ tài khoản khách hàng mới được mở hỗ trợ.", 403);
        var conversation = await db.One("SELECT TOP 1 * FROM SupportConversations WHERE customerId=@customerId AND status='open' ORDER BY id DESC", new { customerId = actor.Id });
        if (conversation is null) return null;
        ((IDictionary<string, object>)conversation)["messages"] = await Messages((int)conversation.id);
        return conversation;
    }

    public async Task<dynamic> CustomerMessage(Actor actor, SupportMessageInput input)
    {
        Rules.Require(actor.Role == "customer", "Chỉ tài khoản khách hàng mới được gửi tin nhắn.", 403);
        var message = Clean(input.Message);
        return await db.Atomic<dynamic>(async () => {
            var conversation = await OpenConversation(actor.Id);
            var saved = await db.One("INSERT SupportMessages(conversationId,senderId,senderRole,message) OUTPUT inserted.* VALUES(@conversationId,@senderId,'customer',@message)", new { conversationId = (int)conversation.id, senderId = actor.Id, message });
            await db.Query("UPDATE SupportConversations SET lastMessageAt=SYSUTCDATETIME() WHERE id=@id", new { id = (int)conversation.id });
            ((IDictionary<string, object>)saved)["senderName"] = "Khách hàng";
            return new { conversationId = (int)conversation.id, message = saved };
        });
    }

    public async Task<List<dynamic>> Conversations(Actor actor)
    {
        Rules.Require(actor.Role is "staff" or "admin", "Bạn không có quyền xem tin nhắn hỗ trợ.", 403);
        return await db.Query("""
            SELECT c.id,c.customerId,c.status,c.createdAt,c.lastMessageAt,u.name customerName,u.phone,
              (SELECT TOP 1 m.message FROM SupportMessages m WHERE m.conversationId=c.id ORDER BY m.id DESC) lastMessage,
              (SELECT COUNT(*) FROM SupportMessages m WHERE m.conversationId=c.id AND m.senderRole='customer') messageCount
            FROM SupportConversations c JOIN Users u ON u.id=c.customerId
            WHERE c.status='open' ORDER BY c.lastMessageAt DESC
            """);
    }

    public async Task<List<dynamic>> ConversationMessages(Actor actor, int id)
    {
        Rules.Require(actor.Role is "staff" or "admin", "Bạn không có quyền xem tin nhắn hỗ trợ.", 403);
        var conversation = await db.One("SELECT id FROM SupportConversations WHERE id=@id", new { id });
        if (conversation is null) throw new BusinessException("Không tìm thấy cuộc trò chuyện.", 404);
        return await Messages(id);
    }

    public async Task<dynamic> StaffMessage(Actor actor, int id, SupportMessageInput input)
    {
        Rules.Require(actor.Role is "staff" or "admin", "Bạn không có quyền trả lời tin nhắn hỗ trợ.", 403);
        var message = Clean(input.Message);
        var conversation = await db.One("SELECT id FROM SupportConversations WHERE id=@id AND status='open'", new { id });
        if (conversation is null) throw new BusinessException("Cuộc trò chuyện đã đóng hoặc không tồn tại.", 404);
        return await db.Atomic<dynamic>(async () => {
            var saved = await db.One("INSERT SupportMessages(conversationId,senderId,senderRole,message) OUTPUT inserted.* VALUES(@conversationId,@senderId,@role,@message)", new { conversationId = id, senderId = actor.Id, role = actor.Role, message });
            await db.Query("UPDATE SupportConversations SET lastMessageAt=SYSUTCDATETIME() WHERE id=@id", new { id });
            ((IDictionary<string, object>)saved)["senderName"] = actor.Role == "admin" ? "Quản lý" : "Nhân viên Bếp Nhà";
            return saved;
        });
    }
}
