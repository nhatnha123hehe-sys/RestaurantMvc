using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RestaurantMvc.Data;
using RestaurantMvc.Services;
using RestaurantMvc.Infrastructure;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter()));
builder.Services.Configure<ApiBehaviorOptions>(o => o.InvalidModelStateResponseFactory = c => new BadRequestObjectResult(new {error="Dữ liệu không hợp lệ. Kiểm tra kiểu số, ngày giờ và các trường bắt buộc."}));
builder.Services.AddScoped<RestaurantDb>();
builder.Services.AddScoped<MenuService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<SupportService>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(o =>
{
    o.Cookie.Name="BepNha.Mvc"; o.Cookie.HttpOnly=true; o.Cookie.SameSite=SameSiteMode.Lax;
    o.ExpireTimeSpan=TimeSpan.FromHours(8);
    o.Events.OnRedirectToLogin=c=> { c.Response.StatusCode=401; return c.Response.WriteAsJsonAsync(new {error="Vui lòng đăng nhập."}); };
    o.Events.OnRedirectToAccessDenied=c=> { c.Response.StatusCode=403; return c.Response.WriteAsJsonAsync(new {error="Bạn không có quyền thực hiện thao tác này."}); };
});
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(o => {
    o.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new FixedWindowRateLimiterOptions { PermitLimit=50, Window=TimeSpan.FromMinutes(15), QueueLimit=0 }));
    o.OnRejected=async(c,t)=> { c.HttpContext.Response.StatusCode=429; await c.HttpContext.Response.WriteAsJsonAsync(new {error="Đăng nhập quá nhiều lần. Vui lòng thử lại sau."},t); };
});
var app = builder.Build();
if(args.Contains("--init-db")) { using var scope=app.Services.CreateScope(); await DatabaseInitializer.Initialize(scope.ServiceProvider,app.Environment.ContentRootPath); return; }
app.Use(async (context,next) => {
    try {
        context.Response.Headers["X-Content-Type-Options"]="nosniff";
        context.Response.Headers["Content-Security-Policy"]="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; frame-ancestors 'none'";
        if(context.Request.Path.StartsWithSegments("/api")) {
            context.Response.Headers.CacheControl="no-store";
            if(!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method)) {
                var origin=context.Request.Headers.Origin.ToString();
                if(origin.Length>0 && origin!=$"{context.Request.Scheme}://{context.Request.Host}") throw new BusinessException("Nguồn yêu cầu không hợp lệ.",403);
                if(!context.Request.HasJsonContentType()) throw new BusinessException("Yêu cầu cần định dạng JSON.",415);
            }
        }
        await next();
    } catch(BusinessException e) { context.Response.StatusCode=e.Status; await context.Response.WriteAsJsonAsync(new {error=e.Message}); }
    catch(SqlException e) when(e.Number is 2601 or 2627) { context.Response.StatusCode=409; await context.Response.WriteAsJsonAsync(new {error="Dữ liệu bị trùng. Kiểm tra mã bàn hoặc tên tài khoản."}); }
    catch(Exception e) { app.Logger.LogError(e,"Lỗi xử lý"); context.Response.StatusCode=500; await context.Response.WriteAsJsonAsync(new {error="Có lỗi xử lý. Vui lòng thử lại."}); }
});
app.UseStaticFiles(); app.UseRouting(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization();
app.MapControllers();
app.MapControllerRoute(name:"default",pattern:"{controller=Home}/{action=Index}/{id?}");
app.Run();

public partial class Program { }
