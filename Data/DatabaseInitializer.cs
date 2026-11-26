using Microsoft.Data.SqlClient;
using Dapper;
using RestaurantMvc.Services.Admin;
using RestaurantMvc.Services.Customer;
using RestaurantMvc.Services.Shared;
using RestaurantMvc.Services.Staff;
using System.Text.Json;
using RestaurantMvc.Models;
namespace RestaurantMvc.Data;
public static class DatabaseInitializer
{
    private sealed class RecipeSeed
    {
        public string Name { get; set; } = "";
        public string Ingredients { get; set; } = "";
        public string Instructions { get; set; } = "";
        public int Servings { get; set; }
        public int PrepMinutes { get; set; }
    }

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
        var schema = await File.ReadAllTextAsync(Path.Combine(root,"Database","schema.sql"));
        // Khi app khởi tạo database kiểm thử, connection đã trỏ đúng database đích.
        // Không để lệnh USE cố định trong file chạy chuyển sang database demo chính.
        schema = System.Text.RegularExpressions.Regex.Replace(schema, @"(?im)^\s*USE\s+[^;\r\n]+;?\s*$", "");
        // schema.sql cũng có thể được chạy trực tiếp trong SSMS nên có các batch GO.
        // Dapper không hiểu GO; tách batch trước khi gửi từng phần tới SQL Server.
        foreach (var batch in System.Text.RegularExpressions.Regex.Split(schema, @"(?im)^\s*GO\s*(?:--.*)?$")
            .Where(batch => !string.IsNullOrWhiteSpace(batch)))
            await db.Query(batch);
        await db.Atomic(async()=>{
            var seedUsers=new (string Username,string Plain,string Name,string Phone,string Role)[]{
                ("admin","admin123","Quản lý Bếp Nhà","0901000001","admin"),
                ("nhanvien","nhanvien123","Nhân viên phục vụ","0902000001","staff"),
                ("nv_minhan","minhan123","Trần Văn An","0902000002","staff"),
                ("nv_thubinh","thubinh123","Nguyễn Thị Bình","0902000003","staff"),
                ("nv_hoangcuong","cuong1234","Lê Hoàng Cường","0902000004","staff"),
                ("nv_minhduc","minhduc123","Phạm Minh Đức","0902000005","staff"),
                ("nv_thuha","thuha1234","Võ Thu Hà","0902000006","staff"),
                ("khach","khach123","Khách trải nghiệm","0901234567","customer"),
                ("kh_tuananh","khach123","Hoàng Tuấn Anh","0903000002","customer"),
                ("kh_ngocmai","khach123","Đặng Ngọc Mai","0903000003","customer"),
                ("kh_quockhanh","khach123","Bùi Quốc Khánh","0903000004","customer"),
                ("kh_thanhvy","khach123","Lý Thanh Vy","0903000005","customer"),
                ("kh_giahao","khach123","Ngô Gia Hào","0903000006","customer"),
                ("kh_baotram","khach123","Đỗ Bảo Trâm","0903000007","customer"),
                ("kh_hoangnam","khach123","Vũ Hoàng Nam","0903000008","customer"),
                ("kh_kimngan","khach123","Phan Kim Ngân","0903000009","customer"),
                ("kh_minhkhoi","khach123","Trịnh Minh Khôi","0903000010","customer")
            };
            foreach(var u in seedUsers)
            {
                var existing=await db.One("SELECT id, demoPassword FROM Users WHERE username=@username",new {username=u.Username});
                if(existing is null)
                    await db.Query("INSERT Users(username,passwordHash,demoPassword,name,phone,role) VALUES(@username,@hash,@plain,@name,@phone,@role)",new {username=u.Username,hash=PasswordService.Hash(u.Plain),plain=u.Plain,name=u.Name,phone=u.Phone,role=u.Role});
                else if(string.IsNullOrEmpty((string?)existing.demoPassword))
                    await db.Query("UPDATE Users SET demoPassword=@plain WHERE username=@username AND (demoPassword IS NULL OR demoPassword='')",new {username=u.Username,plain=u.Plain});
            }
            if(await db.One("SELECT TOP 1 id FROM Categories")==null)
                foreach(var category in new[]{"Món chính","Khai vị","Đồ uống","Tráng miệng"}) await db.Query("INSERT Categories(name) VALUES(@category)",new {category});
            // Seed bổ sung theo tên để các database đã chạy trước đây cũng nhận được món mới.
            var dishes=JsonSerializer.Deserialize<List<DishInput>>(await File.ReadAllTextAsync(Path.Combine(root,"Database","dishes.json")),new JsonSerializerOptions {PropertyNameCaseInsensitive=true})!;
            foreach(var dish in dishes)
                await db.Query("IF NOT EXISTS(SELECT 1 FROM Dishes WHERE name=@Name) INSERT Dishes(categoryId,name,description,price,art) VALUES(@CategoryId,@Name,@Description,@Price,@Art)",dish);
            var recipesPath=Path.Combine(root,"Database","recipes.json");
            if(File.Exists(recipesPath))
            {
                var recipes=JsonSerializer.Deserialize<List<RecipeSeed>>(await File.ReadAllTextAsync(recipesPath),new JsonSerializerOptions {PropertyNameCaseInsensitive=true})!;
                foreach(var recipe in recipes)
                {
                    await db.Query("INSERT DishRecipes(dishId,ingredients,instructions,servings,prepMinutes) SELECT id,@Ingredients,@Instructions,@Servings,@PrepMinutes FROM Dishes d WHERE d.name=@Name AND NOT EXISTS(SELECT 1 FROM DishRecipes r WHERE r.dishId=d.id)",recipe);
                    // Sửa dữ liệu seed cũ từng dùng chuỗi `` `n `` thay vì xuống dòng thật.
                    await db.Query("UPDATE r SET ingredients=@Ingredients,instructions=@Instructions,servings=@Servings,prepMinutes=@PrepMinutes FROM DishRecipes r INNER JOIN Dishes d ON d.id=r.dishId WHERE d.name=@Name AND r.ingredients LIKE '%`n%'",recipe);
                }
            }
            if(await db.One("SELECT TOP 1 id FROM RestaurantTables")==null)
                for(var i=1;i<=10;i++) await db.Query("INSERT RestaurantTables(code,capacity) VALUES(@code,@capacity)",new {code=$"B{i:00}",capacity=i<=3?2:i<=8?4:6});
            return true;
        });
        Console.WriteLine($"Đã khởi tạo {name}. Giữ nguyên dữ liệu hiện có.");
    }
}

