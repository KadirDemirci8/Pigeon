using System.ComponentModel.DataAnnotations;

namespace Pigeon.Api.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string DisplayName { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Bio { get; set; }
    }
}