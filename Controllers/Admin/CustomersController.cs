using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMvc.Services;

namespace RestaurantMvc.Controllers;

[Route("api/customers"), Authorize(Roles="admin")]
public class CustomersController(AccountService service) : ApiController
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(await service.Customers());
}
