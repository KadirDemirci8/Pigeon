using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pigeon.Api.Data;
using Pigeon.Api.DTOs;
using Microsoft.AspNetCore.Identity;
using Pigeon.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Pigeon.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {

        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(AppDbContext context)
        {
            _context = context;
        }



        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Conflict("Username is already taken.");
            }
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return Conflict("Email is already registered.");
            }

            var user = new User
            {
                Username = request.Username,
                DisplayName = request.DisplayName,
                Email = request.Email
            };

            user.PasswordHash = _passwordHasher.HashPassword(
                user, request.Password);


            _context.Users.Add(user);
            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "User registered successfully!",
                userId = user.Id
            });
        }



    }
}
