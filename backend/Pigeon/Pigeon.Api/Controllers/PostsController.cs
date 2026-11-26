using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pigeon.Api.Data;
using System.Security.Claims;
using Pigeon.Api.DTOs;
using Pigeon.Api.Models;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using System.Text.RegularExpressions;

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

            var content = request.Content?.Trim();

            if (string.IsNullOrWhiteSpace(content))
            {
                return BadRequest("Post cannot be empty.");
            }

            var post = new Post
            {
                Content = content,
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


        [HttpPost("with-images")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreatePostWithImages(
            [FromForm] CreatePostWithImagesDto request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var content = request.Content?.Trim() ?? string.Empty;
            var images = request.Images ?? new List<IFormFile>();


            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                "posts"
            );

            Directory.CreateDirectory(uploadsFolder);


            if (images.Count > 10)
            {
                return BadRequest("A post can contain up to 10 images.");
            }

            const long maxImageSize = 5 * 1024 * 1024;

            var allowedExtensions = new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

            foreach (var image in images)
            {
                if (image.Length == 0 || image.Length > maxImageSize)
                {
                    return BadRequest(
                        "Each image must be between 1 byte and 5 MB.");
                }

                var extension = Path.GetExtension(image.FileName)
                    .ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(
                        "Only JPG, JPEG, PNG and WEBP images are allowed.");
                }

                var header = new byte[12];

                using var stream = image.OpenReadStream();

                var bytesRead = await stream.ReadAsync(
                    header.AsMemory(0, header.Length)
                );

                bool isJpeg = bytesRead >= 3 &&
                    header[0] == 0xFF &&
                    header[1] == 0xD8 &&
                    header[2] == 0xFF;

                bool isPng = bytesRead >= 8 &&
                    header[0] == 0x89 &&
                    header[1] == 0x50 &&
                    header[2] == 0x4E &&
                    header[3] == 0x47 &&
                    header[4] == 0x0D &&
                    header[5] == 0x0A &&
                    header[6] == 0x1A &&
                    header[7] == 0x0A;

                bool isWebp = bytesRead >= 12 &&
                    header[0] == 0x52 &&
                    header[1] == 0x49 &&
                    header[2] == 0x46 &&
                    header[3] == 0x46 &&
                    header[8] == 0x57 &&
                    header[9] == 0x45 &&
                    header[10] == 0x42 &&
                    header[11] == 0x50;

                bool validFormat = extension switch
                {
                    ".jpg" or ".jpeg" => isJpeg,
                    ".png" => isPng,
                    ".webp" => isWebp,
                    _ => false
                };

                if (!validFormat)
                {
                    return BadRequest(
                        "The file content does not match its image format.");
                }

                try
                {
                    using var infoStream = image.OpenReadStream();
                    var info = await Image.IdentifyAsync(infoStream);

                    if (info.Width > 4096 || info.Height > 4096)
                    {
                        return BadRequest("Image dimensions must not exceed 4096 pixels.");
                    }

                    using var imageStream = image.OpenReadStream();
                    using var decodedImage = await Image.LoadAsync(imageStream);
                }
                catch (UnknownImageFormatException)
                {
                    return BadRequest("Invalid image format.");
                }
                catch (InvalidImageContentException)
                {
                    return BadRequest("Corrupted image file.");
                }


            }


            var savedImageUrls = new List<string>();




            if (string.IsNullOrWhiteSpace(content) && images.Count == 0)
            {
                return BadRequest("A post must contain text or at least one image.");
            }

            var savedFilePaths = new List<string>();

            try
            {

                foreach (var image in images)
                {
                    var extension = Path.GetExtension(image.FileName)
                        .ToLowerInvariant();

                    var fileName = $"{Guid.NewGuid():N}{extension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    // Başarısız kopyalama durumunda da dosyayı temizleyebilmek için
                    savedFilePaths.Add(filePath);

                    await using (var fileStream = new FileStream(
                        filePath,
                        FileMode.CreateNew
                    ))
                    {
                        await image.CopyToAsync(fileStream);
                    }

                    savedImageUrls.Add($"/uploads/posts/{fileName}");
                }

                var post = new Post
                {
                    Content = content,
                    UserId = userId.Value,
                    Images = savedImageUrls
                        .Select((url, index) => new PostImage
                        {
                            ImageUrl = url,
                            DisplayOrder = index
                        })
                        .ToList()
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Post created successfully!",
                    postId = post.Id,
                    imageCount = post.Images.Count
                });
            }
            catch (Exception ex)
            {
                foreach (var filePath in savedFilePaths)
                {
                    try
                    {
                        if (System.IO.File.Exists(filePath))
                        {
                            System.IO.File.Delete(filePath);
                        }
                    }
                    catch (IOException cleanupError)
                    {
                        Console.Error.WriteLine(
                            $"Failed to delete uploaded file: {cleanupError.Message}");
                    }
                    catch (UnauthorizedAccessException cleanupError)
                    {
                        Console.Error.WriteLine(
                            $"Failed to delete uploaded file: {cleanupError.Message}");
                    }
                }

                Console.Error.WriteLine($"Post creation failed: {ex}");


                return StatusCode(500, new
                {
                    message = "Failed to create post."
                });
            }
        }


        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            var since = DateTime.UtcNow.AddHours(-48);

            // Son 7 günün hashtag içeren gönderileri
            var contents = await _context.Posts
                .AsNoTracking()
                .Where(p =>
                    p.CreatedAt >= since &&
                    p.Content != null &&
                    p.Content.Contains("#"))
                .Select(p => p.Content)
                .ToListAsync();

            var hashtags = contents
                .SelectMany(content =>
                    Regex.Matches(
                        content ?? "",
                        @"(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+"
                    )
                    .Select(match => match.Value)
                    .Distinct(StringComparer.OrdinalIgnoreCase))
                .GroupBy(tag => tag, StringComparer.OrdinalIgnoreCase)
                .Select(group => new
                {
                    hashtag = group.First(),
                    postCount = group.Count()
                })
                .OrderByDescending(tag => tag.postCount)
                .ThenBy(tag => tag.hashtag)
                .Take(3)
                .ToList();

            return Ok(hashtags);
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
                    updatedAt = p.UpdatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,

                    images = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),


                    imageDetails = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => new
                        {
                            id = pi.Id,
                            imageUrl = pi.ImageUrl,
                            displayOrder = pi.DisplayOrder
                        })
                        .ToList(),


                    likeCount = p.Likes.Count(),
                    repostCount = p.Reposts.Count(),
                    isReposted = userId != null &&
                        p.Reposts.Any(r => r.UserId == userId.Value),

                    commentCount = _context.Comments.Count(c => c.PostId == p.Id),
                    isLiked = p.Likes.Any(l => l.UserId == userId),
                    isBookmarked = userId != null &&
                        _context.Bookmarks.Any(b =>
                         b.PostId == p.Id &&
                         b.UserId == userId.Value)

                })
                .ToListAsync();

            return Ok(posts);
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPost(int id)
        {
            var userId = GetCurrentUserId();

            var post = await _context.Posts
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,

                    images = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),


                    likeCount = p.Likes.Count(),
                    repostCount = p.Reposts.Count(),
                    isReposted = userId != null &&
                        p.Reposts.Any(r => r.UserId == userId.Value),

                    commentCount = _context.Comments.Count(c => c.PostId == p.Id),
                    isLiked = p.Likes.Any(l => l.UserId == userId),
                    isBookmarked = userId != null &&
                        _context.Bookmarks.Any(b =>
                            b.PostId == p.Id &&
                            b.UserId == userId.Value)
                })
                .FirstOrDefaultAsync();

            if (post == null)
            {
                return NotFound("Post not found.");
            }

            return Ok(post);
        }


        [Authorize]
        [HttpGet("following")]
        public async Task<IActionResult> GetFollowingPosts()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            // Takip ettiğimiz kullanıcılar
            var followingIds = _context.UserFollows
                .Where(f => f.FollowerId == userId.Value)
                .Select(f => f.FollowingId);

            // 1. Takip edilen kullanıcıların kendi gönderileri
            var posts = await _context.Posts
                .AsNoTracking()
                .Where(p => followingIds.Contains(p.UserId))
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    content = p.Content,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,

                    images = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),

                    imageDetails = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => new
                        {
                            id = pi.Id,
                            imageUrl = pi.ImageUrl,
                            displayOrder = pi.DisplayOrder
                        })
                        .ToList(),

                    likeCount = p.Likes.Count(),
                    commentCount = p.Comments.Count(),
                    repostCount = p.Reposts.Count(),

                    isLiked = p.Likes.Any(l => l.UserId == userId.Value),
                    isReposted = p.Reposts.Any(r => r.UserId == userId.Value),

                    isBookmarked = _context.Bookmarks.Any(b =>
                        b.PostId == p.Id &&
                        b.UserId == userId.Value),

                    repostedBy = (string?)null,
                    repostedByUsername = (string?)null,
                    feedCreatedAt = p.CreatedAt
                })
                .ToListAsync();

            // 2. Takip edilen kullanıcıların repostları
            var reposts = await _context.Reposts
                .AsNoTracking()
                .Where(r => followingIds.Contains(r.UserId))
                .Select(r => new
                {
                    id = r.Post.Id,
                    userId = r.Post.UserId,
                    content = r.Post.Content,
                    createdAt = r.Post.CreatedAt,
                    updatedAt = r.Post.UpdatedAt,
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

                    isLiked = r.Post.Likes.Any(l => l.UserId == userId.Value),
                    isReposted = r.Post.Reposts.Any(rp =>
                        rp.UserId == userId.Value),

                    isBookmarked = _context.Bookmarks.Any(b =>
                        b.PostId == r.PostId &&
                        b.UserId == userId.Value),

                    repostedBy = (string?)r.User.DisplayName,
                    repostedByUsername = (string?)r.User.Username,
                    feedCreatedAt = r.CreatedAt
                })
                .ToListAsync();

            var followingFeed = posts
                .Concat(reposts)
                .GroupBy(p => p.id)
                .Select(group => group
                    .OrderByDescending(p => p.feedCreatedAt)
                    .First())
                .OrderByDescending(p => p.feedCreatedAt)
                .ToList();

            return Ok(followingFeed);
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
                    updatedAt = p.UpdatedAt,
                    username = p.User.Username,
                    displayName = p.User.DisplayName,
                    profileImageUrl = p.User.ProfileImageUrl,
                    images = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => pi.ImageUrl)
                        .ToList(),


                    imageDetails = p.Images
                        .OrderBy(pi => pi.DisplayOrder)
                        .Select(pi => new
                        {
                            id = pi.Id,
                            imageUrl = pi.ImageUrl,
                            displayOrder = pi.DisplayOrder
                        })
                        .ToList(),


                    likeCount = p.Likes.Count(),
                    commentCount = p.Comments.Count(),
                    repostCount = p.Reposts.Count(),

                    isLiked = p.Likes.Any(l => l.UserId == userId),

                    isReposted = userId != null &&
                        p.Reposts.Any(r => r.UserId == userId.Value),

                    isBookmarked = userId != null &&
                        _context.Bookmarks.Any(b =>
                            b.PostId == p.Id &&
                            b.UserId == userId.Value)
                })
                .ToListAsync();

            return Ok(posts);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var post = await _context.Posts.FindAsync(id);

            if (post == null)
                return NotFound();


            if (post.UserId != userId.Value)
                return Forbid();


            if (DateTime.UtcNow >= post.CreatedAt.AddHours(1))
            {
                return StatusCode(403, new
                {
                    message = "Posts can only be edited within 60 minutes of creation."
                });
            }

            var content = request.Content?.Trim() ?? string.Empty;

            var hasImages = await _context.PostImages
                .AnyAsync(pi => pi.PostId == id);

            if (string.IsNullOrWhiteSpace(content) && !hasImages)
            {
                return BadRequest(
                    "A post must contain text or at least one image.");
            }

            post.Content = content;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                post.Id,
                post.Content,
                post.UpdatedAt
            });
        }


        [HttpPut("{id}/images")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdatePostImages(
            int id,
            [FromForm] UpdatePostImagesDto request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var post = await _context.Posts
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return NotFound();

            if (post.UserId != userId.Value)
                return Forbid();

            if (DateTime.UtcNow >= post.CreatedAt.AddHours(1))
            {
                return StatusCode(403, new
                {
                    message = "Posts can only be edited within 60 minutes of creation."
                });
            }


            var removeImageIds = request.RemoveImageIds ?? new List<int>();
            var newImages = request.NewImages ?? new List<IFormFile>();

            if (removeImageIds.Count != removeImageIds.Distinct().Count())
                return BadRequest("Duplicate image IDs are not allowed.");

            var imagesToRemove = post.Images
                .Where(image => removeImageIds.Contains(image.Id))
                .ToList();

            if (imagesToRemove.Count != removeImageIds.Count)
                return BadRequest("One or more images do not belong to this post.");

            var finalImageCount =
                post.Images.Count - imagesToRemove.Count + newImages.Count;

            if (finalImageCount > 10)
                return BadRequest("A post can contain up to 10 images.");


            const long maxImageSize = 5 * 1024 * 1024;

            var allowedExtensions = new[]
            {
    ".jpg", ".jpeg", ".png", ".webp"
};

            foreach (var image in newImages)
            {
                if (image.Length == 0 || image.Length > maxImageSize)
                    return BadRequest("Each image must be between 1 byte and 5 MB.");

                var extension = Path.GetExtension(image.FileName)
                    .ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                    return BadRequest("Only JPG, JPEG, PNG and WEBP images are allowed.");

                var header = new byte[12];

                using (var stream = image.OpenReadStream())
                {
                    var bytesRead = await stream.ReadAsync(header.AsMemory());

                    bool isJpeg = bytesRead >= 3 &&
                        header[0] == 0xFF &&
                        header[1] == 0xD8 &&
                        header[2] == 0xFF;

                    bool isPng = bytesRead >= 8 &&
                        header[0] == 0x89 &&
                        header[1] == 0x50 &&
                        header[2] == 0x4E &&
                        header[3] == 0x47 &&
                        header[4] == 0x0D &&
                        header[5] == 0x0A &&
                        header[6] == 0x1A &&
                        header[7] == 0x0A;

                    bool isWebp = bytesRead >= 12 &&
                        header[0] == 0x52 &&
                        header[1] == 0x49 &&
                        header[2] == 0x46 &&
                        header[3] == 0x46 &&
                        header[8] == 0x57 &&
                        header[9] == 0x45 &&
                        header[10] == 0x42 &&
                        header[11] == 0x50;

                    bool validFormat = extension switch
                    {
                        ".jpg" or ".jpeg" => isJpeg,
                        ".png" => isPng,
                        ".webp" => isWebp,
                        _ => false
                    };

                    if (!validFormat)
                        return BadRequest("The file content does not match its image format.");
                }

                try
                {
                    using var imageStream = image.OpenReadStream();
                    using var decodedImage = await Image.LoadAsync(imageStream);

                    if (decodedImage.Width > 4096 || decodedImage.Height > 4096)
                        return BadRequest("Image dimensions must not exceed 4096 pixels.");
                }
                catch (UnknownImageFormatException)
                {
                    return BadRequest("Invalid image format.");
                }
                catch (InvalidImageContentException)
                {
                    return BadRequest("Corrupted image file.");
                }
            }



            if (finalImageCount == 0 &&
                string.IsNullOrWhiteSpace(post.Content))
            {
                return BadRequest(
                    "A post must contain text or at least one image.");
            }

            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                "posts"
            );

            Directory.CreateDirectory(uploadsFolder);

            var savedFilePaths = new List<string>();

            try
            {
                var nextDisplayOrder = post.Images.Any()
                    ? post.Images.Max(i => i.DisplayOrder) + 1
                    : 0;

                foreach (var image in newImages)
                {
                    var extension = Path.GetExtension(image.FileName)
                        .ToLowerInvariant();

                    var fileName = $"{Guid.NewGuid():N}{extension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    savedFilePaths.Add(filePath);

                    await using (var stream = new FileStream(
                        filePath,
                        FileMode.CreateNew))
                    {
                        await image.CopyToAsync(stream);
                    }

                    post.Images.Add(new PostImage
                    {
                        ImageUrl = $"/uploads/posts/{fileName}",
                        DisplayOrder = nextDisplayOrder++
                    });
                }

                _context.PostImages.RemoveRange(imagesToRemove);

                if (imagesToRemove.Count > 0 || newImages.Count > 0)
                {
                    post.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                foreach (var filePath in savedFilePaths)
                {
                    try
                    {
                        if (System.IO.File.Exists(filePath))
                            System.IO.File.Delete(filePath);
                    }
                    catch (Exception cleanupError)
                        when (cleanupError is IOException ||
                              cleanupError is UnauthorizedAccessException)
                    {
                        Console.Error.WriteLine(cleanupError.Message);
                    }
                }

                Console.Error.WriteLine($"Image update failed: {ex}");

                return StatusCode(500, new
                {
                    message = "Failed to update post images."
                });
            }

            foreach (var image in imagesToRemove)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(image.ImageUrl) ||
                        !image.ImageUrl.StartsWith(
                            "/uploads/posts/",
                            StringComparison.Ordinal))
                    {
                        continue;
                    }

                    var fileName = Path.GetFileName(image.ImageUrl);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    if (System.IO.File.Exists(filePath))
                        System.IO.File.Delete(filePath);
                }
                catch (Exception ex)
                    when (ex is IOException ||
                          ex is UnauthorizedAccessException)
                {
                    Console.Error.WriteLine(
                        $"Failed to delete post image: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = "Post images updated successfully!",
                updatedAt = post.UpdatedAt,
                imageCount = finalImageCount,
                images = post.Images
                    .Where(i => !removeImageIds.Contains(i.Id))
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new
                    {
                        i.Id,
                        i.ImageUrl
                    })
                    .ToList()
            });


        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return NotFound();

            if (post.UserId != userId.Value)
                return Forbid();

            post.IsDeleted = true;
            post.DeletedAt = DateTime.UtcNow;

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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var post = await _context.Posts.FindAsync(id);

            if (post == null)
            {
                return NotFound();
            }

            var content = request.Content?.Trim();

            if (string.IsNullOrWhiteSpace(content))
            {
                return BadRequest("Comment cannot be empty.");
            }

            Comment? parentComment = null;

            if (request.ParentCommentId.HasValue)
            {
                parentComment = await _context.Comments
                    .FirstOrDefaultAsync(c =>
                        c.Id == request.ParentCommentId.Value);

                if (parentComment == null)
                {
                    return NotFound("Parent comment not found.");
                }

                if (parentComment.PostId != id)
                {
                    return BadRequest(
                        "Parent comment does not belong to this post.");
                }

                if (parentComment.ParentCommentId != null)
                {
                    return BadRequest(
                        "You cannot reply to a reply.");
                }
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            var comment = new Comment
            {
                Content = content!,
                UserId = userId.Value,
                PostId = id,
                ParentCommentId = request.ParentCommentId
            };

            _context.Comments.Add(comment);

            // Yeni yorumun ID'sini almak için önce yorumu kaydediyoruz.
            await _context.SaveChangesAsync();

            if (parentComment != null &&
                parentComment.UserId != userId.Value)
            {
                _context.Notifications.Add(new Notification
                {
                    RecipientId = parentComment.UserId,
                    ActorId = userId.Value,
                    Type = "Reply",
                    CommentId = parentComment.Id,
                    PostId = id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (post.UserId != userId.Value &&
                (parentComment == null ||
                 parentComment.UserId != post.UserId))
            {
                _context.Notifications.Add(new Notification
                {
                    RecipientId = post.UserId,
                    ActorId = userId.Value,
                    Type = "Comment",
                    CommentId = comment.Id,
                    PostId = id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Comment created successfully!",
                commentId = comment.Id
            });
        }



        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var userId = GetCurrentUserId();

            var postExists = await _context.Posts
                .AnyAsync(p => p.Id == id);

            if (!postExists)
                return NotFound("Post not found.");

            var comments = await _context.Comments
                        .AsNoTracking()
                .Where(c => c.PostId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    id = c.Id,
                    content = c.Content,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt,
                    userId = c.UserId,
                    username = c.User.Username,
                    displayName = c.User.DisplayName,
                    profileImageUrl = c.User.ProfileImageUrl,
                    parentCommentId = c.ParentCommentId,

                    likeCount = c.Likes.Count(),

                    isLiked = userId != null &&
                        c.Likes.Any(cl => cl.UserId == userId.Value)
                })
                .ToListAsync();

            return Ok(comments);
        }


        [HttpPut("comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(
            int commentId,
            [FromBody] UpdateCommentDto request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var comment = await _context.Comments.FindAsync(commentId);

            if (comment == null)
                return NotFound("Comment not found.");

            if (comment.UserId != userId.Value)
                return Forbid();


            if (DateTime.UtcNow >= comment.CreatedAt.AddHours(1))
            {
                return StatusCode(403, new
                {
                    message = "Comments can only be edited within 60 minutes of creation."
                });
            }

            var content = request.Content?.Trim();

            if (string.IsNullOrWhiteSpace(content))
                return BadRequest("Comment cannot be empty.");

            comment.Content = content;
            comment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = comment.Id,
                content = comment.Content,
                updatedAt = comment.UpdatedAt
            });
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

            // Ana yoruma ait cevapları bul
            var replies = await _context.Comments
                .Where(c => c.ParentCommentId == commentId)
                .ToListAsync();

            // Silinecek bütün yorumların ID'lerini oluştur
            var commentIds = replies
                .Select(r => r.Id)
                .Append(commentId)
                .ToList();

            // Ana yorumun ve cevapların beğenilerini temizle
            var commentLikes = await _context.CommentLikes
                .Where(cl => commentIds.Contains(cl.CommentId))
                .ToListAsync();

            _context.CommentLikes.RemoveRange(commentLikes);

            // Önce cevapları, sonra ana yorumu sil
            _context.Comments.RemoveRange(replies);
            _context.Comments.Remove(comment);

            await _context.SaveChangesAsync();

            return NoContent();
        }


    }
}