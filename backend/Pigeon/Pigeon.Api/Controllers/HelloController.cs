
using Microsoft.AspNetCore.Mvc;

namespace Pigeon.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelloController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetHello()
        {
            return Ok(new
            {
                message = "Hello from Pigeon API!",
                status = "success"
            });
        }
    }
}
