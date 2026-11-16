namespace Pigeon.Api.Models
{
    public class Comment
    {
        public int Id { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int PostId { get; set; }
        public Post Post { get; set; } = null!;
        public ICollection<CommentLike> Likes { get; set; } = new List<CommentLike>();

        public int? ParentCommentId { get; set; }

        public Comment? ParentComment { get; set; }

    }
}