
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(claim, out int id)
                ? id
                : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] bool unreadOnly = false)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var query = _context.Notifications
                .AsNoTracking()
                .Where(n => n.RecipientId == userId.Value);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    id = n.Id,
                    type = n.Type,
                    isRead = n.IsRead,
                    createdAt = n.CreatedAt,
                    postId = n.PostId,
                    actorId = n.ActorId,
                    actorUsername = n.Actor.Username,
                    actorDisplayName = n.Actor.DisplayName,
                    actorProfileImageUrl = n.Actor.ProfileImageUrl
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.Id == id &&
                    n.RecipientId == userId.Value);

            if (notification == null)
                return NotFound();

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return NoContent();
        }


        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            await _context.Notifications
                .Where(n =>
                    n.RecipientId == userId.Value &&
                    !n.IsRead)
                .ExecuteUpdateAsync(setters =>
                    setters.SetProperty(n => n.IsRead, true));

            return NoContent();
        }

    }
}
