using RestaurantMvc.Data;

namespace RestaurantMvc.Services;

public class DashboardService(RestaurantDb db)
{
    public Task<dynamic> Summary() => db.One("""
        SELECT (SELECT COUNT(*) FROM Reservations WHERE status='pending') pendingReservations,
        (SELECT COUNT(*) FROM DiningSessions WHERE closedAt IS NULL) activeTables,
        (SELECT COUNT(*) FROM Orders WHERE status IN ('pending','preparing')) activeOrders,
        (SELECT COALESCE(SUM(total),0) FROM Invoices WHERE status='paid' AND CONVERT(date,DATEADD(hour,7,paidAt))=CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))) todayRevenue
        """);
}
