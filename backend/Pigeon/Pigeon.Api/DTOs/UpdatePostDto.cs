
using System.ComponentModel.DataAnnotations;

namespace Pigeon.Api.DTOs
{
    public class UpdatePostDto
    {
        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;
    }
}
