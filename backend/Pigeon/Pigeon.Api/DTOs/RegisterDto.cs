
using System.ComponentModel.DataAnnotations;

namespace Pigeon.Api.DTOs
{
    public class RegisterDto
    {

        [Required]
        [StringLength(30, MinimumLength = 3)]
        [RegularExpression(
            @"^[a-zA-Z0-9_]+$",
            ErrorMessage = "Username can only contain letters, numbers and underscores.")]
        public string Username { get; set; } = string.Empty;


        [Required]
        [StringLength(50, MinimumLength = 1)]
        [RegularExpression(
            @".*\S.*",
            ErrorMessage = "Display name cannot contain only whitespace.")]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(254, ErrorMessage = "Email cannot exceed 254 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(128, MinimumLength = 8,
            ErrorMessage = "Password must be between 8 and 128 characters.")]
        public string Password { get; set; } = string.Empty;
    }
}
