using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateProjectWithEdbDTO
    {
        [Required]
        [StringLength(200)]
        public string ProjectName { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public int TeamId { get; set; }

        [Required]
        public int ProjectStatusId { get; set; }

        [Required]
        public int PriorityId { get; set; }

        [Required]
        public int EdbId { get; set; } // EDB déjà uploadé
    }
}
