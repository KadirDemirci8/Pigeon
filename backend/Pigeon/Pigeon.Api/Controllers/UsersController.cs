using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using Pigeon.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public UsersController(
            AppDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("{username}")]
        public async Task<ActionResult<UserProfileDto>> GetProfile(string username)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Username == username)
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    DisplayName = u.DisplayName,
                    Bio = u.Bio,
                    ProfileImageUrl = u.ProfileImageUrl,
                    CreatedAt = u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileDto request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            var displayName = request.DisplayName?.Trim();

            if (string.IsNullOrWhiteSpace(displayName) || displayName.Length < 2)
            {
                return BadRequest("Display name must contain at least 2 characters.");
            }

            user.DisplayName = displayName;
            user.Bio = string.IsNullOrWhiteSpace(request.Bio)
                ? null
                : request.Bio.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Profile updated successfully!",
                displayName = user.DisplayName,
                bio = user.Bio
            });
        }
        [Authorize]
        [HttpPost("me/photo")]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile file)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("Please select a photo.");
            if (file.Length < 8)
                return BadRequest("Invalid or corrupted image file.");

            // Maksimum 5 MB
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("Photo must be smaller than 5 MB.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (extension != ".jpg" && extension != ".jpeg" && extension != ".png")
                return BadRequest("Only JPG and PNG files are allowed.");

            // Dosyanın gerçek formatını kontrol et
            byte[] header = new byte[8];

            using (var stream = file.OpenReadStream())
            {
                await stream.ReadExactlyAsync(header);
            }

            bool isJpg =
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF;

            bool isPng =
                header[0] == 0x89 &&
                header[1] == 0x50 &&
                header[2] == 0x4E &&
                header[3] == 0x47 &&
                header[4] == 0x0D &&
                header[5] == 0x0A &&
                header[6] == 0x1A &&
                header[7] == 0x0A;

            if ((extension == ".png" && !isPng) ||
                ((extension == ".jpg" || extension == ".jpeg") && !isJpg))
            {
                return BadRequest("Invalid image file.");
            }

            var folder = Path.Combine(
                _environment.WebRootPath,
                "uploads",
                "profiles"
            );

            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(folder, fileName);

            await using (var stream = new FileStream(filePath, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            user.ProfileImageUrl = $"/uploads/profiles/{fileName}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Profile photo uploaded successfully!",
                profileImageUrl = user.ProfileImageUrl
            });
        }
    }
}