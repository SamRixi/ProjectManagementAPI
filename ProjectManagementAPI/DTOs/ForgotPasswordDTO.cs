using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ForgotPasswordDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
