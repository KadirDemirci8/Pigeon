using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pigeon.Api.Data;
using Pigeon.Api.DTOs;
using Pigeon.Api.Models;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string AuthCookieName = "pigeon_auth";
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IAntiforgery _antiforgery;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(AppDbContext context, IConfiguration configuration, IAntiforgery antiforgery)
        {
            _context = context;
            _configuration = configuration;
            _antiforgery = antiforgery;
        }

        [HttpGet("csrf")]
        [AllowAnonymous]
        public IActionResult GetCsrfToken()
        {
            Response.Headers.CacheControl = "no-store";
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new { requestToken = tokens.RequestToken });
        }

        [HttpPost("register")]
        [EnableRateLimiting("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return Conflict("Username is already taken.");
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return Conflict("Email is already registered.");

            var user = new User
            {
                Username = request.Username,
                DisplayName = request.DisplayName,
                Email = request.Email
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User registered successfully!", userId = user.Id });
        }

        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return Unauthorized("Invalid email or password.");

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid email or password.");

            var expires = DateTimeOffset.UtcNow.AddMinutes(GetExpiryMinutes());
            var token = GenerateJwtToken(user, expires.UtcDateTime);
            Response.Cookies.Append(AuthCookieName, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None, // localhost HTTP Vite + HTTPS API (cross-site)
                Path = "/api",
                Expires = expires,
                IsEssential = true
            });
            Response.Headers.CacheControl = "no-store";

            // Never return the JWT itself to JavaScript.
            return Ok(new { message = "Login successful!", userId = user.Id, username = user.Username });
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            var idValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!int.TryParse(idValue, out var userId)) return Unauthorized();

            var username = User.FindFirst(ClaimTypes.Name)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value;
            Response.Headers.CacheControl = "no-store";
            return Ok(new { userId, username });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/api"
            });
            Response.Headers.CacheControl = "no-store";
            return Ok(new { message = "Logged out." });
        }

        private double GetExpiryMinutes()
        {
            var value = _configuration["Jwt:ExpiryMinutes"];
            if (!double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var minutes)
                || minutes <= 0)
                throw new InvalidOperationException("Jwt:ExpiryMinutes must be a positive number.");
            return minutes;
        }

        private string GenerateJwtToken(User user, DateTime expiresUtc)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Convert.FromBase64String(jwtSettings["Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiresUtc,
                signingCredentials: credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
