using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateTeamDTO
    {
        [Required]
        public int TeamId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string TeamName { get; set; }

        public string? Description { get; set; }
    }
}
