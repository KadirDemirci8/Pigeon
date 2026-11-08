using System.ComponentModel.DataAnnotations;

namespace Pigeon.Api.DTOs
{
    public class CreateCommentDto
    {
        [Required]
        [StringLength(500, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;
    }
}