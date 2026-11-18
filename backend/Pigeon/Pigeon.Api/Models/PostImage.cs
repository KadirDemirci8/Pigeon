
namespace Pigeon.Api.Models
{
    public class PostImage
    {
        public int Id { get; set; }

        public int PostId { get; set; }
        public Post Post { get; set; } = null!;

        public string ImageUrl { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }
    }
}
