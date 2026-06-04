using System.ComponentModel.DataAnnotations;

namespace IKONEX_Academy.DTOs.Subject
{
    public class CreateSubjectDto
    {
        [Required(ErrorMessage = "Subject name is required")]
        [StringLength(150, ErrorMessage = "Subject name cannot exceed 150 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject code is required")]
        [StringLength(20, ErrorMessage = "Subject code cannot exceed 20 characters")]
        public string Code { get; set; } = string.Empty;
    }
}
