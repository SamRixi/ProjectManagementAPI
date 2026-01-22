using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ResetPasswordDTO
    {
        [Required]
        public string Token { get; set; } // Token envoyé par email

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; }
    }
}
