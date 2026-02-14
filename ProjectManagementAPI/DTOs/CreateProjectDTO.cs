using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateProjectDTO
    {
        [Required(ErrorMessage = "Nom du projet requis")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Nom doit avoir entre 3 et 200 caractères")]
        public string ProjectName { get; set; }

        [StringLength(1000, ErrorMessage = "Description max 1000 caractères")]
        public string? Description { get; set; }

        // ✅ CHANGÉ: DateTime? au lieu de DateTime (nullable)
        public DateTime? StartDate { get; set; }

        // ✅ CHANGÉ: DateTime? au lieu de DateTime (nullable)
        public DateTime? EndDate { get; set; }

        // ✅ CHANGÉ: int? au lieu de int (nullable, removed [Required])
        public int? ProjectStatusId { get; set; }

        // ✅ CHANGÉ: int? au lieu de int (nullable, removed [Required])
        public int? PriorityId { get; set; }

        // ✅ CHANGÉ: int? au lieu de int (nullable, removed [Required])
        public int? TeamId { get; set; }

        public int? ProjectManagerId { get; set; }
        public int? CreatedByUserId { get; set; }
    }
}
