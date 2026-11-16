
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using Pigeon.Api.Models;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/comments")]
    [Authorize]
    public class CommentLikesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentLikesController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claim, out int userId))
                return userId;

            return null;
        }

        [HttpPost("{commentId:int}/like")]
        public async Task<IActionResult> LikeComment(int commentId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var commentExists = await _context.Comments
                .AnyAsync(c => c.Id == commentId);

            if (!commentExists)
                return NotFound("Comment not found.");

            var alreadyLiked = await _context.CommentLikes
                .AnyAsync(cl =>
                    cl.UserId == userId.Value &&
                    cl.CommentId == commentId);

            if (alreadyLiked)
                return Conflict("Comment is already liked.");

            var commentLike = new CommentLike
            {
                UserId = userId.Value,
                CommentId = commentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CommentLikes.Add(commentLike);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Comment liked successfully."
            });
        }

        [HttpDelete("{commentId:int}/like")]
        public async Task<IActionResult> UnlikeComment(int commentId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var commentLike = await _context.CommentLikes
                .FirstOrDefaultAsync(cl =>
                    cl.UserId == userId.Value &&
                    cl.CommentId == commentId);

            if (commentLike == null)
                return NotFound("Comment like not found.");

            _context.CommentLikes.Remove(commentLike);

            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}
