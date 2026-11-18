
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using Pigeon.Api.Models;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/reposts")]
    [Authorize]
    public class RepostsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RepostsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
                return userId;

            return null;
        }

        [HttpPost("{postId:int}")]
        public async Task<IActionResult> RepostPost(int postId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var postExists = await _context.Posts
                .AnyAsync(p => p.Id == postId);

            if (!postExists)
                return NotFound("Post not found.");

            var alreadyReposted = await _context.Reposts
                .AnyAsync(r =>
                    r.UserId == userId.Value &&
                    r.PostId == postId);

            if (alreadyReposted)
                return Conflict("Post is already reposted.");

            var repost = new Repost
            {
                UserId = userId.Value,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reposts.Add(repost);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Post reposted successfully."
            });
        }


        [HttpDelete("{postId:int}")]
        public async Task<IActionResult> UndoRepost(int postId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var repost = await _context.Reposts
                .FirstOrDefaultAsync(r =>
                    r.UserId == userId.Value &&
                    r.PostId == postId);

            if (repost == null)
                return NotFound("Repost not found.");

            _context.Reposts.Remove(repost);

            await _context.SaveChangesAsync();

            return NoContent();
        }


        [HttpGet("user/{username}")]
        public async Task<IActionResult> GetUserReposts(string username)
        {
            var userId = GetCurrentUserId();

            var userExists = await _context.Users
                .AnyAsync(u => u.Username == username);

            if (!userExists)
                return NotFound("User not found.");

            var reposts = await _context.Reposts
                .AsNoTracking()
                .Where(r => r.User.Username == username)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Post.Id,
                    userId = r.Post.UserId,
                    content = r.Post.Content,
                    createdAt = r.Post.CreatedAt,
                    username = r.Post.User.Username,
                    displayName = r.Post.User.DisplayName,
                    profileImageUrl = r.Post.User.ProfileImageUrl,

                    images = r.Post.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),


                    imageDetails = r.Post.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => new
                        {
                            id = pi.Id,
                            imageUrl = pi.ImageUrl,
                            displayOrder = pi.DisplayOrder
                        })
                        .ToList(),


                    likeCount = r.Post.Likes.Count(),
                    commentCount = r.Post.Comments.Count(),
                    repostCount = r.Post.Reposts.Count(),

                    isLiked = r.Post.Likes.Any(l => l.UserId == userId),
                    isReposted = userId != null &&
                        r.Post.Reposts.Any(rp => rp.UserId == userId.Value),

                    isBookmarked = userId != null &&
                        _context.Bookmarks.Any(b =>
                            b.PostId == r.PostId &&
                            b.UserId == userId.Value),

                    repostedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reposts);
        }


    }
}
