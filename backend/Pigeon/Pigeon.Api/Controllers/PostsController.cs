using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pigeon.Api.Data;
using System.Security.Claims;
using Pigeon.Api.DTOs;
using Pigeon.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(userId, out int id))
            {
                return id;
            }

            return null;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var post = new Post
            {
                Content = request.Content,
                UserId = userId.Value
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Post created successfully!",
                postId = post.Id
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetPosts()
        {
            var posts = await _context.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id = p.Id,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName
                })
                .ToListAsync();

            return Ok(posts);
        }
    }
}