
namespace Pigeon.Api.DTOs
{
    public class UpdatePostImagesDto
    {
        public List<int> RemoveImageIds { get; set; } = new();

        public List<IFormFile> NewImages { get; set; } = new();
    }
}
