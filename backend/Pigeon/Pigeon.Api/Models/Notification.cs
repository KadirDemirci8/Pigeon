
using System;

namespace Pigeon.Api.Models
{
    public class Notification
    {
        public int Id { get; set; }

        public int RecipientId { get; set; }
        public User Recipient { get; set; } = null!;

        public int ActorId { get; set; }
        public User Actor { get; set; } = null!;

        public string Type { get; set; } = string.Empty;

        public int? PostId { get; set; }
        public Post? Post { get; set; }

        // Reply bildiriminde cevap verilen ana yorumun ID'si
        public int? CommentId { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
