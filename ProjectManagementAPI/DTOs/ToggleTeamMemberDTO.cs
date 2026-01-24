using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ToggleTeamMemberDTO
    {
        [Required]
        public int TeamId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
       
        public bool IsActive { get; set; }
   
    }
}