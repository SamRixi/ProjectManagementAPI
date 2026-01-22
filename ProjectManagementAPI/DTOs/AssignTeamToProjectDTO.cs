using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class AssignTeamToProjectDTO
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int TeamId { get; set; }
    }
}
