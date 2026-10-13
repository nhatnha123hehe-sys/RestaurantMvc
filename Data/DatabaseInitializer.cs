using Microsoft.Data.SqlClient;
using Dapper;
using RestaurantMvc.Services;
using System.Text.Json;
using RestaurantMvc.Models;
namespace RestaurantMvc.Data;
public static class DatabaseInitializer
{
    public static async Task Initialize(IServiceProvider services,string root)
    {
        var config=services.GetRequiredService<IConfiguration>();
        var builder=new SqlConnectionStringBuilder(config.GetConnectionString("Restaurant"));
        var name=builder.InitialCatalog;
        if(!System.Text.RegularExpressions.Regex.IsMatch(name,@"^[A-Za-z][A-Za-z0-9_]{0,100}$")) throw new Exception("Tên database không hợp lệ.");
        builder.InitialCatalog="master";
        await using(var master=new SqlConnection(builder.ConnectionString)) {
            await master.OpenAsync();
            if(await master.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM sys.databases WHERE name=@name",new {name})==0)
                await master.ExecuteAsync($"CREATE DATABASE [{name}]");
        }
        var db=services.GetRequiredService<RestaurantDb>();
        await db.Query(await File.ReadAllTextAsync(Path.Combine(root,"Database","schema.sql")));
        await db.Atomic(async()=>{
            foreach(var u in new[]{("admin","admin123","Quản lý Bếp Nhà","admin"),("nhanvien","nhanvien123","Nhân viên phục vụ","staff"),("khach","khach123","Khách trải nghiệm","customer")})
                await db.Query("IF NOT EXISTS(SELECT 1 FROM Users WHERE username=@username) INSERT Users(username,passwordHash,name,phone,role) VALUES(@username,@hash,@name,'0901234567',@role)",new {username=u.Item1,hash=PasswordService.Hash(u.Item2),name=u.Item3,role=u.Item4});
            if(await db.One("SELECT TOP 1 id FROM Categories")==null) {
                foreach(var category in new[]{"Món chính","Khai vị","Đồ uống","Tráng miệng"}) await db.Query("INSERT Categories(name) VALUES(@category)",new {category});
                var dishes=JsonSerializer.Deserialize<List<DishInput>>(await File.ReadAllTextAsync(Path.Combine(root,"Database","dishes.json")),new JsonSerializerOptions {PropertyNameCaseInsensitive=true})!;
                foreach(var dish in dishes) await db.Query("INSERT Dishes(categoryId,name,description,price,art) VALUES(@CategoryId,@Name,@Description,@Price,@Art)",dish);
            }
            if(await db.One("SELECT TOP 1 id FROM RestaurantTables")==null)
                for(var i=1;i<=10;i++) await db.Query("INSERT RestaurantTables(code,capacity) VALUES(@code,@capacity)",new {code=$"B{i:00}",capacity=i<=3?2:i<=8?4:6});
            return true;
        });
        Console.WriteLine($"Đã khởi tạo {name}. Giữ nguyên dữ liệu hiện có.");
    }
}
