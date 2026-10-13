using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantMvc.Services;
using RestaurantMvc.Models;
using RestaurantMvc.Data;
namespace RestaurantMvc.Controllers;
[Route("api")]
public class MenuController(MenuService service,RestaurantDb db) : ApiController
{
    [HttpGet("health")] public async Task<IActionResult> Health() { var r=await db.One("SELECT DB_NAME() name"); return Ok(new {ok=true,database=(string)r.name,framework="ASP.NET Core MVC"}); }
    [HttpGet("categories")] public async Task<IActionResult> Categories() => Ok(await service.Categories());
    [HttpGet("menu")] public async Task<IActionResult> Menu([FromQuery]string? all) => Ok(await service.Menu(all=="1" && User.IsInRole("admin")));
    [HttpPost("menu"),Authorize(Roles="admin")] public async Task<IActionResult> Add(DishInput b) => StatusCode(201,await service.Save(b));
    [HttpPut("menu/{id:int}"),Authorize(Roles="admin")] public async Task<IActionResult> Edit(int id,DishInput b) => Ok(await service.Save(b,id));

    [HttpGet("menu/{id:int}")] public async Task<IActionResult> Detail(int id) => Ok(await service.Detail(id,User.IsInRole("admin")));
    [HttpPost("menu/{id:int}/recipe"),Authorize(Roles="admin")] public async Task<IActionResult> CreateRecipe(int id,RecipeInput b) => StatusCode(201,await service.SaveRecipe(id,b,true));
    [HttpPut("menu/{id:int}/recipe"),Authorize(Roles="admin")] public async Task<IActionResult> UpdateRecipe(int id,RecipeInput b) => Ok(await service.SaveRecipe(id,b,false));
    [HttpDelete("menu/{id:int}/recipe"),Authorize(Roles="admin")] public async Task<IActionResult> DeleteRecipe(int id) { await service.DeleteRecipe(id); return Ok(new {ok=true}); }
}
