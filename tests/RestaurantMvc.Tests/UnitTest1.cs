using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Data.SqlClient;
using RestaurantMvc.Data;
using Dapper;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit.Abstractions;

namespace RestaurantMvc.Tests;

public sealed class RestaurantFixture : IAsyncLifetime
{
    private readonly string database="RestaurantMvc_Test_"+Guid.NewGuid().ToString("N");
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public string Connection => $"Server=Diddy\\SQLEXPRESS;Database={database};Integrated Security=True;Encrypt=True;TrustServerCertificate=True";
    public async Task InitializeAsync()
    {
        Factory=new WebApplicationFactory<Program>().WithWebHostBuilder(b=>b.ConfigureAppConfiguration((_,c)=>c.AddInMemoryCollection(new Dictionary<string,string?>{{"ConnectionStrings:Restaurant",Connection}})));
        using var scope=Factory.Services.CreateScope();
        var root=Factory.Services.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>().ContentRootPath;
        await DatabaseInitializer.Initialize(scope.ServiceProvider,root);
    }
    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync(); SqlConnection.ClearAllPools();
        // Chỉ xóa database GUID do fixture này tạo, không chạm database của website.
        Assert.Matches(@"^RestaurantMvc_Test_[a-f0-9]{32}$",database);
        var builder=new SqlConnectionStringBuilder(Connection){InitialCatalog="master"};
        await using var master=new SqlConnection(builder.ConnectionString);
        await master.ExecuteAsync($"IF DB_ID('{database}') IS NOT NULL BEGIN ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{database}]; END");
    }
    public HttpClient Client() => Factory.CreateClient(new WebApplicationFactoryClientOptions {AllowAutoRedirect=false});
    public async Task Sql(string sql,object? args=null) { await using var c=new SqlConnection(Connection); await c.ExecuteAsync(sql,args); }
}

public class ApiTests(RestaurantFixture fixture,ITestOutputHelper output) : IClassFixture<RestaurantFixture>
{
    private static async Task<(int Status,JsonNode Body)> Call(HttpClient c,string url,string method="GET",object? body=null)
    {
        using var request=new HttpRequestMessage(new HttpMethod(method),"/api"+url);
        if(method!="GET") request.Content=JsonContent.Create(body??new {});
        using var response=await c.SendAsync(request);
        var text=await response.Content.ReadAsStringAsync();
        return ((int)response.StatusCode,JsonNode.Parse(text)??JsonValue.Create("null")!);
    }
    private static int Id(JsonNode n)=>n["id"]!.GetValue<int>();
    private static async Task<JsonNode> Expect(HttpClient c,string url,string method="GET",object? body=null,int status=200)
    {
        var r=await Call(c,url,method,body); Assert.True(r.Status==status,$"{method} {url}: expected {status}, got {r.Status}: {r.Body}");return r.Body;
    }
    private async Task<HttpClient> Login(string username,string password)
    {
        var c=fixture.Client(); await Expect(c,"/auth/login","POST",new {username,password});return c;
    }
    [Fact] public async Task Razor_menu_and_assets_are_served()
    {
        using var c=fixture.Client(); var html=await c.GetStringAsync("/"); Assert.Contains("Bếp Nhà",html); Assert.Contains("/app.js",html);
        Assert.True((await c.GetAsync("/styles.css")).IsSuccessStatusCode);
        Assert.True((await c.GetAsync("/assets/rice.svg")).IsSuccessStatusCode);
        Assert.Equal(42,(await Expect(c,"/menu")).AsArray().Count);
        Assert.Equal(4,(await Expect(c,"/categories")).AsArray().Count);
    }
    [Theory]
    [InlineData("/orders")][InlineData("/reservations")][InlineData("/sessions")][InlineData("/invoices")][InlineData("/dashboard")]
    public async Task Private_endpoints_require_login(string url) { using var c=fixture.Client(); await Expect(c,url,status:401); }
    [Theory]
    [InlineData("admin","admin123","admin")][InlineData("nhanvien","nhanvien123","staff")][InlineData("khach","khach123","customer")]
    public async Task Existing_scrypt_accounts_and_logout(string username,string password,string role)
    {
        using var c=await Login(username,password); Assert.Equal(role,(await Expect(c,"/auth/me"))["role"]!.GetValue<string>());
        await Expect(c,"/auth/logout","POST"); await Expect(c,"/sessions",status:401);
    }
    [Fact] public async Task Wrong_password_and_cross_origin_writes_are_rejected()
    {
        using var c=fixture.Client(); await Expect(c,"/auth/login","POST",new {username="admin",password="wrong"},401);
        c.DefaultRequestHeaders.Add("Origin","https://other.example"); await Expect(c,"/auth/login","POST",new {username="admin",password="admin123"},403);
    }
    [Fact] public async Task Complete_restaurant_flow_concurrency_ownership_and_invoices()
    {
        using var c=await Login("khach","khach123"); using var staff=await Login("nhanvien","nhanvien123"); using var admin=await Login("admin","admin123"); using var other=fixture.Client();
        await Expect(staff,"/dashboard",status:403); await Expect(admin,"/dashboard");
        var outsider=await Expect(other,"/auth/register","POST",new {username="other_test",password="test12345",name="Khách khác",phone="0909999999"},201);
        var customerId=Id(await Expect(c,"/auth/me"));
        await Expect(c,"/orders",status:403); await Expect(staff,"/menu","POST",new {name="Không có quyền"},403);
        var dish=(await Expect(c,"/menu"))[0]!; int dishId=Id(dish),price=dish["price"]!.GetValue<int>();
        var table=(await Expect(c,"/tables"))[0]!; int tableId=Id(table);
        var future=DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).Date.AddDays(1).AddHours(12);
        var start=new DateTimeOffset(future,TimeSpan.FromHours(7));
        object Booking(DateTimeOffset when,double guests=2) => new {tableId,startAt=when,guests,name="Khách kiểm thử",phone="0901234567",note="Test C#"};
        await Expect(c,"/reservations","POST",Booking(DateTimeOffset.UtcNow.AddMinutes(-1)),400);
        await Expect(c,"/reservations","POST",Booking(start.AddHours(11)),400);
        await Expect(c,"/reservations","POST",Booking(start,1.5),400);
        var race=await Task.WhenAll(Call(c,"/reservations","POST",Booking(start)),Call(other,"/reservations","POST",Booking(start)));
        Assert.Equal(new[]{201,409},race.Select(r=>r.Status).Order().ToArray()); int rid=Id(race.Single(r=>r.Status==201).Body);
        await fixture.Sql("UPDATE Reservations SET userId=@customerId WHERE id=@rid",new {customerId,rid});
        var query="/availability?guests=2&startAt="+Uri.EscapeDataString(start.ToString("O"));
        Assert.DoesNotContain((await Expect(c,query)).AsArray(),t=>Id(t!)==tableId);
        await Expect(admin,$"/tables/{tableId}","PUT",new {code="B01",capacity=1,enabled=true},409);
        await Expect(admin,$"/tables/{tableId}","PUT",new {code="B01",capacity=2,enabled=false},409);
        await Expect(other,$"/reservations/{rid}","PATCH",new {status="cancelled",reason="Không có quyền"},403);
        await Expect(staff,$"/reservations/{rid}/seat","POST",status:409);
        await Expect(staff,$"/reservations/{rid}","PATCH",new {status="confirmed"});
        await Expect(staff,$"/reservations/{rid}/seat","POST",status:409);
        await fixture.Sql("UPDATE Reservations SET startAt=DATEADD(minute,-1,SYSUTCDATETIME()),endAt=DATEADD(hour,2,SYSUTCDATETIME()) WHERE id=@rid",new {rid});
        var seated=await Task.WhenAll(Expect(staff,$"/reservations/{rid}/seat","POST"),Expect(staff,$"/reservations/{rid}/seat","POST"));
        int sid=Id(seated[0]); Assert.Equal(sid,Id(seated[1]));
        Assert.Contains((await Expect(c,query)).AsArray(),t=>Id(t!)==tableId);
        output.WriteLine("Đạt: validation, đặt bàn đồng thời, phân quyền, nhận bàn đúng thời gian và chống nhận lặp.");
        object Order(int unitPrice,double quantity=2,string? key=null)=>new {sessionId=sid,requestKey=key??Guid.NewGuid().ToString(),note="Test",items=new[]{new {dishId,quantity,unitPrice}}};
        await Expect(other,"/orders","POST",Order(price),403); await Expect(other,$"/sessions/{sid}/orders",status:403);
        await Expect(c,"/orders","POST",new {sessionId=sid,requestKey=Guid.NewGuid().ToString(),items=Array.Empty<object>()},400);
        await Expect(c,"/orders","POST",Order(price,1.5),400); await Expect(c,"/orders","POST",Order(1),409);
        var body=Order(price); var placed=await Task.WhenAll(Expect(c,"/orders","POST",body,201),Expect(c,"/orders","POST",body,201));
        int oid=Id(placed[0]);Assert.Equal(oid,Id(placed[1]));
        var orders=await Expect(c,$"/sessions/{sid}/orders");Assert.Single(orders.AsArray());Assert.Equal(2,orders[0]!["items"]![0]!["quantity"]!.GetValue<int>());
        await Expect(staff,$"/orders/{oid}","PATCH",new {status="served"},409);
        await Expect(staff,$"/sessions/{sid}/invoice","POST",status:409);
        await Expect(staff,$"/orders/{oid}","PATCH",new {status="cancelled"},400);
        await Expect(staff,$"/orders/{oid}","PATCH",new {status="preparing"});
        await Expect(staff,$"/orders/{oid}","PATCH",new {status="cancelled",reason="Muộn"},409);
        await Expect(staff,$"/orders/{oid}","PATCH",new {status="served"});
        output.WriteLine("Đạt: giỏ không hợp lệ, giá do server kiểm tra, chống gửi đơn lặp và chuyển trạng thái.");
        object Edit(bool available,bool visible,int newPrice)=>new {name=dish["name"]!.GetValue<string>(),description="Test",categoryId=dish["categoryId"]!.GetValue<int>(),price=newPrice,art="rice",available,visible};
        await Expect(admin,$"/menu/{dishId}","PUT",Edit(false,true,price+10000)); await Expect(c,"/orders","POST",Order(price),409);
        await Expect(admin,$"/menu/{dishId}","PUT",Edit(true,false,price+10000)); await Expect(c,"/orders","POST",Order(price),409);
        Assert.DoesNotContain((await Expect(c,"/menu")).AsArray(),d=>Id(d!)==dishId);
        await Expect(admin,$"/menu/{dishId}","PUT",Edit(true,true,price+10000)); await Expect(c,"/orders","POST",Order(price),409);
        int extra=Id(await Expect(c,"/orders","POST",Order(price+10000,1),201));
        await Expect(staff,$"/orders/{extra}","PATCH",new {status="preparing"});await Expect(staff,$"/orders/{extra}","PATCH",new {status="served"});
        int cancelled=Id(await Expect(c,"/orders","POST",Order(price+10000,3),201));await Expect(staff,$"/orders/{cancelled}","PATCH",new {status="cancelled",reason="Khách đổi ý"});
        var bills=await Task.WhenAll(Expect(staff,$"/sessions/{sid}/invoice","POST"),Expect(staff,$"/sessions/{sid}/invoice","POST"));
        int iid=Id(bills[0]);Assert.Equal(iid,Id(bills[1]));Assert.Equal(price*3+10000,bills[0]["total"]!.GetValue<int>());
        await Expect(c,"/orders","POST",Order(price+10000),409);await Expect(other,$"/invoices/{iid}",status:403);
        Assert.Equal(2,(await Expect(c,$"/invoices/{iid}"))["items"]!.AsArray().Count);
        await Expect(c,$"/invoices/{iid}/pay","POST",new {method="cash"},403);
        var paid=await Task.WhenAll(Expect(staff,$"/invoices/{iid}/pay","POST",new {method="cash"}),Expect(staff,$"/invoices/{iid}/pay","POST",new {method="cash"}));
        Assert.All(paid,b=>Assert.Equal("paid",b["status"]!.GetValue<string>()));
        Assert.Equal("free",(await Expect(c,"/tables")).AsArray().Single(t=>Id(t!)==tableId)!["status"]!.GetValue<string>());
        Assert.Equal("closed",(await Expect(c,"/sessions")).AsArray().Single(t=>Id(t!)==sid)!["status"]!.GetValue<string>());
        await Expect(c,"/orders","POST",Order(price+10000),409);
        output.WriteLine("Đạt: giá lịch sử, món ẩn/hết, gọi thêm, hủy có lý do, hóa đơn và thanh toán đồng thời đúng một lần.");
        var next=await Expect(c,"/reservations","POST",Booking(start),201);int nextId=Id(next);
        await Expect(staff,$"/reservations/{nextId}","PATCH",new {status="confirmed"});
        await fixture.Sql("UPDATE Reservations SET startAt=DATEADD(minute,-1,SYSUTCDATETIME()),endAt=DATEADD(hour,2,SYSUTCDATETIME()) WHERE id=@nextId",new {nextId});
        var ns=await Expect(staff,$"/reservations/{nextId}/seat","POST"); Assert.NotEqual(sid,Id(ns));Assert.Empty((await Expect(c,$"/sessions/{Id(ns)}/orders")).AsArray());
        var added=await Expect(admin,"/tables","POST",new {code="B_TEST",capacity=4},201);
        await Expect(admin,"/tables","POST",new {code="B_TEST",capacity=4},409);
        await Expect(admin,$"/tables/{Id(added)}","PUT",new {code="B_TEST",capacity=6,enabled=false});
        await Expect(admin,"/menu","POST",Edit(true,true,-1),400);await Expect(admin,"/menu","POST",Edit(true,true,35000),201);
        // Khôi phục món để các test đọc menu không phụ thuộc thứ tự chạy của xUnit.
        await fixture.Sql("DELETE Dishes WHERE id>@dishId AND name=@name AND price=35000",new {dishId,name=dish["name"]!.GetValue<string>()});
        await Expect(admin,$"/menu/{dishId}","PUT",Edit(true,true,price));
        output.WriteLine("Đạt: lượt mới không lẫn đơn cũ; thêm/sửa món và bàn, chặn mã trùng/giá âm.");
    }

    [Fact] public async Task Recipe_crud_admin_only_public_detail_hidden_dish_and_validation()
    {
        using var guest=fixture.Client();using var admin=await Login("admin","admin123");using var customer=await Login("khach","khach123");using var staff=await Login("nhanvien","nhanvien123");
        int id=Id((await Expect(guest,"/menu"))[0]!);
        var url=$"/menu/{id}/recipe";
        var recipe=new {ingredients="Gạo: 100 g\nThịt gà: 150 g",instructions="Chuẩn bị nguyên liệu.\nChế biến và trình bày.",servings=1,prepMinutes=30};
        try {
            await fixture.Sql("DELETE DishRecipes WHERE dishId=@id",new {id});
            Assert.Null((await Expect(guest,$"/menu/{id}"))["recipe"]);
            foreach(var method in new[]{"POST","PUT","DELETE"}) {
                await Expect(guest,url,method,recipe,401);await Expect(customer,url,method,recipe,403);await Expect(staff,url,method,recipe,403);
            }
            await Expect(admin,url,"POST",new {ingredients="  ",instructions="Bước 1",servings=1,prepMinutes=30},400);
            await Expect(admin,url,"POST",new {ingredients="Gạo",instructions="Nấu cơm",servings=0,prepMinutes=30},400);
            await Expect(admin,url,"POST",new {ingredients=new string('a',4001),instructions="Nấu cơm",servings=1,prepMinutes=30},400);
            await Expect(admin,"/menu/2147483647/recipe","POST",recipe,404);
            await Expect(admin,url,"POST",recipe,201);await Expect(admin,url,"POST",recipe,409);
            var detail=await Expect(guest,$"/menu/{id}");Assert.Equal(recipe.ingredients,detail["recipe"]!["ingredients"]!.GetValue<string>());
            await Expect(admin,url,"PUT",new {ingredients="Gạo: 200 g",instructions="Nấu cơm.",servings=2,prepMinutes=40});
            Assert.Equal(2,(await Expect(guest,$"/menu/{id}"))["recipe"]!["servings"]!.GetValue<int>());
            await fixture.Sql("UPDATE Dishes SET visible=0 WHERE id=@id",new {id});
            await Expect(guest,$"/menu/{id}",status:404);await Expect(customer,$"/menu/{id}",status:404);await Expect(admin,$"/menu/{id}");
            await Expect(admin,url,"DELETE");Assert.Null((await Expect(admin,$"/menu/{id}"))["recipe"]);
            await Expect(admin,url,"PUT",recipe,404);await Expect(admin,url,"DELETE",status:404);
            await Expect(admin,url,"POST",recipe,201);
            // Chạy init lại không tái tạo công thức đã xóa hoặc ghi đè nội dung.
            await Expect(admin,url,"DELETE");
            using var scope=fixture.Factory.Services.CreateScope();
            var root=fixture.Factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
            await DatabaseInitializer.Initialize(scope.ServiceProvider,root);
            Assert.NotNull((await Expect(admin,$"/menu/{id}"))["recipe"]);
        } finally {await fixture.Sql("DELETE DishRecipes WHERE dishId=@id; UPDATE Dishes SET visible=1 WHERE id=@id",new {id});}
    }
}
