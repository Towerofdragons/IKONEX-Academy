using System.ComponentModel.DataAnnotations;

namespace IKONEX_Academy.DTOs.Stream
{
    public class CreateStreamDto
    {
        [Required(ErrorMessage = "Stream name is required")]
        [StringLength(100, ErrorMessage = "Stream name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
    }
}
