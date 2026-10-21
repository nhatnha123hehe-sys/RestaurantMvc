using Microsoft.AspNetCore.Mvc;
namespace RestaurantMvc.Areas.Admin.Controllers;

[Area("Admin")]
[Route("admin")]
public class IndexController : ControllerBase
{
    [HttpGet]
    public IActionResult Index() => Ok(new { area = "Admin", role = "Quản lý" });
}
