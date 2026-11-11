namespace Pigeon.Api.Models
{
    public class UserFollow
    {
        public int Id { get; set; }

        // Takip eden kullanıcı
        public int FollowerId { get; set; }
        public User Follower { get; set; } = null!;

        // Takip edilen kullanıcı
        public int FollowingId { get; set; }
        public User Following { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}