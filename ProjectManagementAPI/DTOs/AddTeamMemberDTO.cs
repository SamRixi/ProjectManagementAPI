using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class AddTeamMemberDTO
    {
        [Required]
        public int TeamId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int RoleId { get; set; }

        public bool IsProjectManager { get; set; } = false;
    }
}
