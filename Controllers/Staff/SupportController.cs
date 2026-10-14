using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMvc.Models;
using RestaurantMvc.Services;

namespace RestaurantMvc.Controllers;

[Route("api/support"), Authorize]
public class SupportController(SupportService service) : ApiController
{
    [HttpGet("conversation"), Authorize(Roles="customer")]
    public async Task<IActionResult> CustomerConversation() => Ok(await service.CustomerConversation(Current));

    [HttpPost("conversation/messages"), Authorize(Roles="customer")]
    public async Task<IActionResult> CustomerMessage(SupportMessageInput input) => StatusCode(201, await service.CustomerMessage(Current, input));

    [HttpGet("conversations"), Authorize(Roles="staff,admin")]
    public async Task<IActionResult> Conversations() => Ok(await service.Conversations(Current));

    [HttpGet("conversations/{id:int}/messages"), Authorize(Roles="staff,admin")]
    public async Task<IActionResult> Messages(int id) => Ok(await service.ConversationMessages(Current, id));

    [HttpPost("conversations/{id:int}/messages"), Authorize(Roles="staff,admin")]
    public async Task<IActionResult> StaffMessage(int id, SupportMessageInput input) => StatusCode(201, await service.StaffMessage(Current, id, input));
}
