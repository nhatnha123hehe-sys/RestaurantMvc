using RestaurantMvc.Data;
using RestaurantMvc.Models;
using RestaurantMvc.Infrastructure;
using System.Text.RegularExpressions;
namespace RestaurantMvc.Services;
public class AccountService(RestaurantDb db)
{
    public async Task<dynamic> Login(LoginInput b)
    {
        var username=Rules.Text(b.Username,"Tên đăng nhập",60); var password=Rules.Text(b.Password,"Mật khẩu",128);
        var u=await db.One("SELECT * FROM Users WHERE username=@username",new {username});
        if(u is null) throw new BusinessException("Tên đăng nhập hoặc mật khẩu không đúng.",401);
        if(!PasswordService.Verify(password,(string)u.passwordHash)) throw new BusinessException("Tên đăng nhập hoặc mật khẩu không đúng.",401);
        return u;
    }
    public async Task<dynamic> Register(RegisterInput b)
    {
        var username=Rules.Text(b.Username,"Tên đăng nhập",60);
        Rules.Require(Regex.IsMatch(username,@"^[a-zA-Z0-9_]{3,60}$"),"Tên đăng nhập gồm 3–60 chữ, số hoặc dấu gạch dưới.");
        var password=Rules.Text(b.Password,"Mật khẩu",128); Rules.Require(password.Length>=8,"Mật khẩu cần ít nhất 8 ký tự.");
        var name=Rules.Text(b.Name,"Họ tên"); var phone=Rules.Phone(b.Phone);
        return await db.One("INSERT Users(username,passwordHash,name,phone,role) OUTPUT inserted.* VALUES(@username,@passwordHash,@name,@phone,'customer')",new {username,passwordHash=PasswordService.Hash(password),name,phone});
    }
    public Task<dynamic> Find(int id) => db.One("SELECT id,username,name,phone,role FROM Users WHERE id=@id",new {id});
    public Task<List<dynamic>> Customers() => db.Query("""
        SELECT u.id,u.username,u.name,u.phone,u.createdAt,
          (SELECT COUNT(*) FROM Reservations r WHERE r.userId=u.id) reservationCount,
          (SELECT COUNT(*) FROM Orders o WHERE o.userId=u.id) orderCount
        FROM Users u WHERE u.role='customer' ORDER BY u.createdAt DESC,u.id DESC
        """);
}
