using RestaurantMvc.Controllers;
using RestaurantMvc.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantMvc.Areas.Admin.Controllers;

[Area("Admin")]

[Route("api"), Authorize(Roles="admin")]
public class DashboardController(DashboardService service) : ApiController
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await service.Summary());
}


