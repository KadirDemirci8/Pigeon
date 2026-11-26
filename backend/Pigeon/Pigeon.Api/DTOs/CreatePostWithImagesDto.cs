
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Pigeon.Api.DTOs
{
    public class CreatePostWithImagesDto
    {
        [StringLength(1000)]
        public string? Content { get; set; }

        public List<IFormFile> Images { get; set; } = new();
    }
}
