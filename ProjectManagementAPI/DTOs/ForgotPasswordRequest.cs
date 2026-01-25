using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Email requis")]
        [EmailAddress(ErrorMessage = "Format email invalide")]
        public string Email { get; set; }
    }
}
