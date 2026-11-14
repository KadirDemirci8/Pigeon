using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;
using Pigeon.Api.Models;
using System.Security.Claims;

namespace Pigeon.Api.Controllers
{
    [ApiController]
    [Route("api/follows")]
    [Authorize]
    public class FollowsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FollowsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("{userId:int}")]
        public async Task<IActionResult> FollowUser(int userId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            if (currentUserId == userId)
                return BadRequest("You cannot follow yourself.");

            var targetExists = await _context.Users
                .AnyAsync(u => u.Id == userId);

            if (!targetExists)
                return NotFound("User not found.");

            var alreadyFollowing = await _context.UserFollows
                .AnyAsync(f =>
                    f.FollowerId == currentUserId &&
                    f.FollowingId == userId);

            if (alreadyFollowing)
                return Conflict("You already follow this user.");

            var follow = new UserFollow
            {
                FollowerId = currentUserId,
                FollowingId = userId
            };


            _context.UserFollows.Add(follow);

            var notification = new Notification
            {
                RecipientId = userId,
                ActorId = currentUserId,
                Type = "Follow",
                PostId = null,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new { message = "User followed successfully." });

        }

        [HttpDelete("{userId:int}")]
        public async Task<IActionResult> UnfollowUser(int userId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            var follow = await _context.UserFollows
                .FirstOrDefaultAsync(f =>
                    f.FollowerId == currentUserId &&
                    f.FollowingId == userId);

            if (follow == null)
                return NotFound("You are not following this user.");

            _context.UserFollows.Remove(follow);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User unfollowed successfully." });
        }
        [HttpGet("{userId:int}/status")]
        public async Task<IActionResult> GetFollowStatus(int userId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            var userExists = await _context.Users
                .AnyAsync(u => u.Id == userId);

            if (!userExists)
                return NotFound("User not found.");

            var followersCount = await _context.UserFollows
                .CountAsync(f => f.FollowingId == userId);

            var followingCount = await _context.UserFollows
                .CountAsync(f => f.FollowerId == userId);

            var isFollowing = await _context.UserFollows
                .AnyAsync(f =>
                    f.FollowerId == currentUserId &&
                    f.FollowingId == userId);

            return Ok(new
            {
                followersCount,
                followingCount,
                isFollowing
            });
        }

        [HttpGet("{userId:int}/followers")]
        public async Task<IActionResult> GetFollowers(int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == userId);

            if (!userExists)
                return NotFound("User not found.");

            var followers = await _context.UserFollows
                .Where(f => f.FollowingId == userId)
                .Select(f => new
                {
                    f.Follower.Id,
                    f.Follower.Username,
                    f.Follower.DisplayName,
                    f.Follower.ProfileImageUrl
                })
                .ToListAsync();

            return Ok(followers);
        }

        [HttpGet("{userId:int}/following")]
        public async Task<IActionResult> GetFollowing(int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == userId);

            if (!userExists)
                return NotFound("User not found.");

            var following = await _context.UserFollows
                .Where(f => f.FollowerId == userId)
                .Select(f => new
                {
                    f.Following.Id,
                    f.Following.Username,
                    f.Following.DisplayName,
                    f.Following.ProfileImageUrl
                })
                .ToListAsync();

            return Ok(following);
        }


    }
}