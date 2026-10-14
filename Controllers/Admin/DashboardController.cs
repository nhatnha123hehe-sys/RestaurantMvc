using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMvc.Services;

namespace RestaurantMvc.Controllers;

[Route("api"), Authorize(Roles="admin")]
public class DashboardController(DashboardService service) : ApiController
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await service.Summary());
}
