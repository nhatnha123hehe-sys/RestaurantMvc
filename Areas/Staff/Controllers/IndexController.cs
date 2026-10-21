using Microsoft.AspNetCore.Mvc;
namespace RestaurantMvc.Areas.Staff.Controllers;

[Area("Staff")]
[Route("staff")]
public class IndexController : ControllerBase
{
    [HttpGet]
    public IActionResult Index() => Ok(new { area = "Staff", role = "Nhân viên" });
}