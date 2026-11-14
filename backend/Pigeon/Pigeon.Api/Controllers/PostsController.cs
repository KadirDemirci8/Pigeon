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
        public async Task<IActionResult> GetPosts([FromQuery] string? q)
        {
            var userId = GetCurrentUserId();

            var query = _context.Posts
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var search = q.Trim();

                query = query.Where(p => p.Content.Contains(search));
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,
                    likeCount = p.Likes.Count(),
                    isLiked = p.Likes.Any(l => l.UserId == userId)
                })
                .ToListAsync();

            return Ok(posts);
        }

        [AllowAnonymous]
        [HttpGet("user/{username}")]
        public async Task<IActionResult> GetUserPosts(string username)
        {
            var userId = GetCurrentUserId();

            var posts = await _context.Posts
                .AsNoTracking()
                .Where(p => p.User.Username == username)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,
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

            // Kullanıcı kendi gönderisini beğenirse bildirim oluşturma
            if (post.UserId != userId.Value)
            {
                // Aynı kullanıcı aynı gönderi için daha önce
                // Like bildirimi oluşturmuş mu?
                var notificationExists = await _context.Notifications
                    .AnyAsync(n =>
                        n.ActorId == userId.Value &&
                        n.RecipientId == post.UserId &&
                        n.PostId == id &&
                        n.Type == "Like");

                if (!notificationExists)
                {
                    var notification = new Notification
                    {
                        RecipientId = post.UserId,
                        ActorId = userId.Value,
                        Type = "Like",
                        PostId = id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);
                }
            }

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

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> CreateComment(
        int id, [FromBody] CreateCommentDto request)
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

            var content = request.Content?.Trim();

            if (string.IsNullOrWhiteSpace(content))
            {
                return BadRequest("Comment cannot be empty.");
            }

            var comment = new Comment
            {
                Content = content!,
                UserId = userId.Value,
                PostId = id
            };


            _context.Comments.Add(comment);

            if (post.UserId != userId.Value)
            {
                var notification = new Notification
                {
                    RecipientId = post.UserId,
                    ActorId = userId.Value,
                    Type = "Comment",
                    PostId = id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "Comment created successfully!",
                commentId = comment.Id
            });
        }
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var comments = await _context.Comments
                .AsNoTracking()
                .Where(c => c.PostId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    id = c.Id,
                    content = c.Content,
                    createdAt = c.CreatedAt,
                    userId = c.UserId,
                    username = c.User.Username,
                    displayName = c.User.DisplayName,
                    profileImageUrl = c.User.ProfileImageUrl
                })
                .ToListAsync();
            return Ok(comments);
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var comment = await _context.Comments.FindAsync(commentId);

            if (comment == null)
            {
                return NotFound();
            }

            if (comment.UserId != userId.Value)
            {
                return Forbid();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}