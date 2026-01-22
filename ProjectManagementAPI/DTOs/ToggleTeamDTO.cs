using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ToggleTeamDTO
    {
        [Required]
        public int TeamId { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}
