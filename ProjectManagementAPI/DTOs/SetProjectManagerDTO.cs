using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class SetProjectManagerDTO
    {
        [Required]
        public int TeamMemberId { get; set; }

        [Required]
        public bool IsProjectManager { get; set; }
    }
}
