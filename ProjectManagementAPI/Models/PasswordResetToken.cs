using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class PasswordResetToken
    {
        public int PasswordResetTokenId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(500)]
        public string Token { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; }

        // Navigation property
        public User User { get; set; }
    }
}
