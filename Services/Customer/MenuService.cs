using RestaurantMvc.Data;
using RestaurantMvc.Models;
using RestaurantMvc.Infrastructure;
namespace RestaurantMvc.Services.Customer;
public class MenuService(RestaurantDb db)
{
    public Task<List<dynamic>> Categories() => db.Query("SELECT * FROM Categories ORDER BY id");
    public Task<List<dynamic>> Menu(bool all) => db.Query($"SELECT d.*,c.name categoryName FROM Dishes d JOIN Categories c ON c.id=d.categoryId {(all?"":"WHERE d.visible=1")} ORDER BY d.categoryId,d.id");
    public async Task<dynamic> Save(DishInput b,int? id=null)
    {
        b.Name=Rules.Text(b.Name,"Tên món"); b.Description=Rules.Text(b.Description,"Mô tả",500,false);
        Rules.Require(new[]{"rice","noodle","fish","grill","veg","roll","fries","tea","coffee","dessert"}.Contains(b.Art),"Hình minh họa không hợp lệ.");
        if(await db.One("SELECT id FROM Categories WHERE id=@CategoryId",b)==null) throw new BusinessException("Danh mục không tồn tại.");
        var args=new {id,b.Name,b.Description,b.CategoryId,b.Price,b.Available,b.Visible,b.Art};
        var row=await db.One(id==null ? "INSERT Dishes(categoryId,name,description,price,available,visible,art) OUTPUT inserted.* VALUES(@CategoryId,@Name,@Description,@Price,@Available,@Visible,@Art)" : "UPDATE Dishes SET categoryId=@CategoryId,name=@Name,description=@Description,price=@Price,available=@Available,visible=@Visible,art=@Art OUTPUT inserted.* WHERE id=@id",args);
        if(row==null) throw new BusinessException("Không tìm thấy món.",404); return row;
    }

    public async Task<dynamic> Detail(int id,bool admin)
    {
        var dish=await db.One("SELECT d.*,c.name categoryName FROM Dishes d JOIN Categories c ON c.id=d.categoryId WHERE d.id=@id AND (d.visible=1 OR @admin=1)",new {id,admin});
        if(dish is null) throw new BusinessException("Không tìm thấy món.",404);
        ((IDictionary<string,object?>)dish)["recipe"]=await db.One("SELECT * FROM DishRecipes WHERE dishId=@id",new {id});
        return dish;
    }
    public async Task<dynamic> SaveRecipe(int id,RecipeInput b,bool create)
    {
        var ingredients=Rules.Text(b.Ingredients,"Nguyên liệu",4000);
        var instructions=Rules.Text(b.Instructions,"Cách chế biến",8000);
        return await db.Atomic<dynamic>(async()=>{
            if(await db.One("SELECT id FROM Dishes WITH(UPDLOCK,HOLDLOCK) WHERE id=@id",new {id}) is null) throw new BusinessException("Không tìm thấy món.",404);
            var existing=await db.One("SELECT dishId FROM DishRecipes WHERE dishId=@id",new {id});
            if(create && existing is not null) throw new BusinessException("Món đã có công thức. Chọn sửa công thức.",409);
            if(!create && existing is null) throw new BusinessException("Công thức không còn tồn tại. Tải lại chi tiết món.",404);
            return await db.One(create
                ? "INSERT DishRecipes(dishId,ingredients,instructions,servings,prepMinutes) OUTPUT inserted.* VALUES(@id,@ingredients,@instructions,@Servings,@PrepMinutes)"
                : "UPDATE DishRecipes SET ingredients=@ingredients,instructions=@instructions,servings=@Servings,prepMinutes=@PrepMinutes,updatedAt=SYSUTCDATETIME() OUTPUT inserted.* WHERE dishId=@id",
                new {id,ingredients,instructions,b.Servings,b.PrepMinutes});
        });
    }
    public Task<bool> DeleteRecipe(int id) => db.Atomic(async()=>{
        if(await db.One("SELECT id FROM Dishes WITH(UPDLOCK,HOLDLOCK) WHERE id=@id",new {id}) is null) throw new BusinessException("Không tìm thấy món.",404);
        if(await db.One("DELETE DishRecipes OUTPUT deleted.dishId WHERE dishId=@id",new {id}) is null) throw new BusinessException("Công thức không còn tồn tại.",404);
        return true;
    });
}


