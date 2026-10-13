using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;
namespace RestaurantMvc.Infrastructure;
public class BusinessException(string message, int status = 400) : Exception(message) { public int Status { get; } = status; }
public static class Rules
{
    public static void Require(bool condition, string message, int status = 400) { if (!condition) throw new BusinessException(message,status); }
    public static string Text(string? value, string label, int max = 100, bool required = true)
    {
        Require(value != null && value.Trim().Length <= max && (!required || value.Trim().Length > 0), $"{label} không hợp lệ (tối đa {max} ký tự).");
        return value!.Trim();
    }
    public static string Phone(string? value) { var s=Text(value,"Số điện thoại",15); Require(Regex.IsMatch(s,@"^0\d{9,10}$"),"Số điện thoại gồm 10–11 chữ số, bắt đầu bằng 0."); return s; }
    public static DateTime Schedule(DateTimeOffset value)
    {
        var now = DateTimeOffset.UtcNow;
        Require(value > now && value <= now.AddDays(30),"Chọn thời gian trong tương lai, tối đa 30 ngày.");
        var local = value.ToOffset(TimeSpan.FromHours(7));
        var minute = local.Hour*60+local.Minute;
        Require(minute>=600 && minute<=1200,"Nhận đặt bàn từ 10:00 đến 20:00, mỗi lượt 2 giờ.");
        return value.UtcDateTime;
    }
}
// SQL DATETIME2 đang lưu UTC. Gắn Z khi gửi JSON để trình duyệt không hiểu thành giờ máy.
public sealed class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options) => reader.GetDateTime().ToUniversalTime();
    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options) => writer.WriteStringValue(DateTime.SpecifyKind(value,DateTimeKind.Utc));
}
