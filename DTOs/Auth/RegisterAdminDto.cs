using System.ComponentModel.DataAnnotations;

namespace IKONEX_Academy.DTOs.Auth
{
    public class RegisterAdminDto
    {
        [Required(ErrorMessage = "Username is required.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 150 characters.")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")]
        public required string Password { get; set; }
    }
}
