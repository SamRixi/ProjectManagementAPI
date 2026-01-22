using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ToggleUserActiveDTO
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}
