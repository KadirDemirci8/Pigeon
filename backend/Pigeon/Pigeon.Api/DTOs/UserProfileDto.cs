namespace Pigeon.Api.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }

        public string Username { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;

        public string? Bio { get; set; }
        public string? ProfileImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}