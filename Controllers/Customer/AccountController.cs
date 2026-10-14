using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using RestaurantMvc.Services;
using RestaurantMvc.Models;
namespace RestaurantMvc.Controllers;
[Route("api/auth")]
public class AccountController(AccountService service) : ApiController
{
    [HttpGet("me")] public async Task<IActionResult> Me() => new JsonResult(User.Identity?.IsAuthenticated==true ? await service.Find(Current.Id) : null);
    [HttpPost("login"),EnableRateLimiting("login")] public async Task<IActionResult> Login(LoginInput b) => await SignIn(await service.Login(b));
    [HttpPost("register"),EnableRateLimiting("login")] public async Task<IActionResult> Register(RegisterInput b) => await SignIn(await service.Register(b),201);
    private async Task<IActionResult> SignIn(dynamic u,int status=200)
    {
        var claims=new[]{new Claim(ClaimTypes.NameIdentifier,((int)u.id).ToString()),new Claim(ClaimTypes.Name,(string)u.username),new Claim(ClaimTypes.Role,(string)u.role)};
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,new ClaimsPrincipal(new ClaimsIdentity(claims,CookieAuthenticationDefaults.AuthenticationScheme)));
        return StatusCode(status,new {id=(int)u.id,username=(string)u.username,name=(string)u.name,phone=(string)u.phone,role=(string)u.role});
    }
    [HttpPost("logout")] public async Task<IActionResult> Logout() { await HttpContext.SignOutAsync(); return Ok(new {ok=true}); }
}
