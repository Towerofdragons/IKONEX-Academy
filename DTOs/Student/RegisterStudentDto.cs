using System;
using System.ComponentModel.DataAnnotations;

namespace IKONEX_Academy.DTOs.Student
{
    public class RegisterStudentDto
    {
        [Required(ErrorMessage = "Student name is required")]
        [StringLength(200, ErrorMessage = "Student name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Registration number is required")]
        [StringLength(50, ErrorMessage = "Registration number cannot exceed 50 characters")]
        public string RegNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Stream ID is required")]
        public Guid StreamId { get; set; }
    }
}
