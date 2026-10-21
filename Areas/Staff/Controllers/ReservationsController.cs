using RestaurantMvc.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantMvc.Services;
using RestaurantMvc.Models;
namespace RestaurantMvc.Areas.Staff.Controllers;

[Area("Staff")]
[Route("api")]
public class ReservationsController(ReservationService service) : ApiController
{
    [HttpGet("tables")] public async Task<IActionResult> Tables() => Ok(await service.Tables());
    [HttpPost("tables"),Authorize(Roles="admin")] public async Task<IActionResult> AddTable(TableInput b) => StatusCode(201,await service.AddTable(b));
    [HttpPut("tables/{id:int}"),Authorize(Roles="admin")] public async Task<IActionResult> EditTable(int id,TableInput b) => Ok(await service.EditTable(id,b));
    [HttpGet("availability")] public async Task<IActionResult> Availability([FromQuery]DateTimeOffset startAt,[FromQuery]int guests) => Ok(await service.Availability(startAt,guests));
    [HttpGet("reservations"),Authorize] public async Task<IActionResult> List() => Ok(await service.List(Current));
    [HttpPost("reservations"),Authorize(Roles="customer")] public async Task<IActionResult> Book(ReservationInput b) => StatusCode(201,await service.Book(Current,b));
    [HttpPatch("reservations/{id:int}"),Authorize] public async Task<IActionResult> Change(int id,StatusInput b) => Ok(await service.Change(Current,id,b));
    [HttpPost("reservations/{id:int}/seat"),Authorize(Roles="staff,admin")] public async Task<IActionResult> Seat(int id) => Ok(await service.Seat(id));
}
