using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ToggleTeamMemberDTO
    {
        [Required]
        public int TeamMemberId { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}
