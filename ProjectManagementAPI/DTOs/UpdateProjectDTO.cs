using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateProjectDTO
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        [StringLength(200)]
        public string ProjectName { get; set; }

        public string Description { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int ProjectStatusId { get; set; }
        public int PriorityId { get; set; }
        public int? ProjectManagerId { get; set; }  // Permet de changer le chef
    }
}
