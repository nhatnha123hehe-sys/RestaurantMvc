using System.ComponentModel.DataAnnotations;
namespace RestaurantMvc.Models;
public record Actor(int Id, string Role);
public class LoginInput { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }
public class RegisterInput : LoginInput { public string Name { get; set; } = ""; public string Phone { get; set; } = ""; }
public class DishInput
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    [Range(1,int.MaxValue)] public int CategoryId { get; set; }
    [Range(1,10000000)] public int Price { get; set; }
    [Required] public bool? Available { get; set; }
    [Required] public bool? Visible { get; set; }
    public string Art { get; set; } = "rice";
}
public class TableInput
{
    public string Code { get; set; } = "";
    [Range(1,30)] public int Capacity { get; set; }
    public bool? Enabled { get; set; }
}
public class ReservationInput
{
    [Range(1,int.MaxValue)] public int TableId { get; set; }
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    [Range(1,30)] public int Guests { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public string Note { get; set; } = "";
}
public class StatusInput { public string Status { get; set; } = ""; public string Reason { get; set; } = ""; }
public class OrderInput
{
    [Range(1,int.MaxValue)] public int SessionId { get; set; }
    public string RequestKey { get; set; } = "";
    public string Note { get; set; } = "";
    [Required,MinLength(1),MaxLength(50)] public List<OrderItemInput> Items { get; set; } = [];
}
public class OrderItemInput
{
    [Range(1,int.MaxValue)] public int DishId { get; set; }
    [Range(1,99)] public int Quantity { get; set; }
    [Range(1,10000000)] public int UnitPrice { get; set; }
}
public class PaymentInput { public string Method { get; set; } = ""; }

public class RecipeInput
{
    [Required,MaxLength(4000)] public string Ingredients { get; set; } = "";
    [Required,MaxLength(8000)] public string Instructions { get; set; } = "";
    [Range(1,20)] public int Servings { get; set; } = 1;
    [Range(1,1440)] public int PrepMinutes { get; set; } = 30;
}
