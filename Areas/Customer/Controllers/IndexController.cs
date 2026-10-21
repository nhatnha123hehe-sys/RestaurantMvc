using Microsoft.AspNetCore.Mvc;
namespace RestaurantMvc.Areas.Customer.Controllers;

[Area("Customer")]
[Route("customer")]
public class IndexController : ControllerBase
{
    [HttpGet]
    public IActionResult Index() => Ok(new { area = "Customer", role = "Khách hàng" });
}
