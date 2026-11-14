
using System;

namespace Pigeon.Api.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // Bildirimi alan kullanıcı
        public int RecipientId { get; set; }
        public User Recipient { get; set; } = null!;

        // Bildirimi oluşturan kullanıcı
        public int ActorId { get; set; }
        public User Actor { get; set; } = null!;

        // Follow, Like veya Comment
        public string Type { get; set; } = string.Empty;

        // Like/Comment bildirimi için ilgili gönderi
        // Follow bildiriminde null
        public int? PostId { get; set; }
        public Post? Post { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
