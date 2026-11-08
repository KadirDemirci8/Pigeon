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
            var userId = GetCurrentUserId();
            var posts = await _context.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    likeCount = p.Likes.Count(),
                    isLiked = p.Likes.Any(l => l.UserId == userId)
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);

            if (post == null)
            {
                return NotFound();
            }
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (post.UserId != userId.Value)
            {
                return Forbid();

            }
            _context.Posts.Remove(post);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);

            if (post == null)
            {
                return NotFound();
            }
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }
            var alreadyLiked = await _context.Likes.AnyAsync(l =>
            l.UserId == userId.Value && l.PostId == id);

            if (alreadyLiked)
            {
                return Conflict("You have already liked this post.");
            }

            var like = new Like
            {
                UserId = userId.Value,
                PostId = id
            };

            _context.Likes.Add(like);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Post liked successfully!"
            });
        }

        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikePost(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }
            var like = await _context.Likes.FirstOrDefaultAsync(l =>
                l.UserId == userId.Value && l.PostId == id);

            if (like == null)
            {
                return NotFound("Like not found.");
            }

            _context.Likes.Remove(like);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}