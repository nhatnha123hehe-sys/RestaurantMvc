using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantMvc.Services;
using RestaurantMvc.Models;
namespace RestaurantMvc.Controllers;
[Route("api"),Authorize]
public class OrdersController(OrderService service) : ApiController
{
    [HttpGet("sessions")] public async Task<IActionResult> Sessions() => Ok(await service.Sessions(Current));
    [HttpGet("sessions/{id:int}/orders")] public async Task<IActionResult> SessionOrders(int id) => Ok(await service.Orders(Current,id));
    [HttpGet("orders"),Authorize(Roles="staff,admin")] public async Task<IActionResult> All() => Ok(await service.Orders(Current));
    [HttpPost("orders"),Authorize(Roles="customer")] public async Task<IActionResult> Place(OrderInput b) => StatusCode(201,await service.Place(Current,b));
    [HttpPatch("orders/{id:int}"),Authorize(Roles="staff,admin")] public async Task<IActionResult> Change(int id,StatusInput b) => Ok(await service.Change(Current,id,b));
    [HttpPost("sessions/{id:int}/invoice"),Authorize(Roles="staff,admin")] public async Task<IActionResult> Invoice(int id) => Ok(await service.Invoice(Current,id));
    [HttpGet("invoices")] public async Task<IActionResult> Invoices() => Ok(await service.Invoices(Current));
    [HttpGet("invoices/{id:int}")] public async Task<IActionResult> Detail(int id) => Ok(await service.Detail(Current,id));
    [HttpPost("invoices/{id:int}/pay"),Authorize(Roles="staff,admin")] public async Task<IActionResult> Pay(int id,PaymentInput b) => Ok(await service.Pay(Current,id,b));
    [HttpGet("dashboard"),Authorize(Roles="admin")] public async Task<IActionResult> Dashboard() => Ok(await service.Dashboard());
}
