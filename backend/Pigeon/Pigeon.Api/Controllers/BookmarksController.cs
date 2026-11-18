
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using Pigeon.Api.Models;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/bookmarks")]
    [Authorize]
    public class BookmarksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookmarksController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out int id)
                ? id
                : null;
        }

        [HttpPost("{postId:int}")]
        public async Task<IActionResult> BookmarkPost(int postId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var postExists = await _context.Posts
                .AnyAsync(p => p.Id == postId);

            if (!postExists)
                return NotFound("Post not found.");

            var alreadyBookmarked = await _context.Bookmarks
                .AnyAsync(b =>
                    b.UserId == userId.Value &&
                    b.PostId == postId);

            if (alreadyBookmarked)
                return Conflict("Post is already bookmarked.");

            var bookmark = new Bookmark
            {
                UserId = userId.Value,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookmarks.Add(bookmark);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Post bookmarked successfully."
            });
        }


        [HttpDelete("{postId:int}")]
        public async Task<IActionResult> RemoveBookmark(int postId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var bookmark = await _context.Bookmarks
                .FirstOrDefaultAsync(b =>
                    b.UserId == userId.Value &&
                    b.PostId == postId);

            if (bookmark == null)
                return NotFound("Bookmark not found.");

            _context.Bookmarks.Remove(bookmark);

            await _context.SaveChangesAsync();

            return NoContent();
        }


        [HttpGet]
        public async Task<IActionResult> GetBookmarks()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var bookmarks = await _context.Bookmarks
                .AsNoTracking()
                .Where(b => b.UserId == userId.Value)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    id = b.Post.Id,
                    userId = b.Post.UserId,
                    content = b.Post.Content,
                    createdAt = b.Post.CreatedAt,
                    username = b.Post.User.Username,
                    displayName = b.Post.User.DisplayName,
                    profileImageUrl = b.Post.User.ProfileImageUrl,

                    images = b.Post.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),

                    likeCount = b.Post.Likes.Count(),
                    repostCount = b.Post.Reposts.Count(),
                    isReposted = userId != null &&
                        b.Post.Reposts.Any(r => r.UserId == userId.Value),

                    commentCount = _context.Comments.Count(c => c.PostId == b.PostId),
                    isLiked = b.Post.Likes.Any(l => l.UserId == userId.Value),
                    isBookmarked = true
                })
                .ToListAsync();

            return Ok(bookmarks);
        }

    }
}
