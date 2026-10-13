using Microsoft.AspNetCore.Mvc;
using RestaurantMvc.Models;
using System.Security.Claims;
namespace RestaurantMvc.Controllers;
[ApiController]
public abstract class ApiController : ControllerBase
{
    protected Actor Current => new(int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),User.FindFirstValue(ClaimTypes.Role)!);
}
