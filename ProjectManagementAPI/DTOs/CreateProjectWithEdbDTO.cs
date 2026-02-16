using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ProjectManagementAPI.DTOs
{
    public class CreateProjectWithEdbDTO
    {
        [Required(ErrorMessage = "EDB ID requis")]
        public int EdbId { get; set; }

        [Required(ErrorMessage = "Nom du projet requis")]
        [StringLength(200, MinimumLength = 3)]
        public string ProjectName { get; set; }

        // ✅ ENLEVÉ [Required]
        [StringLength(1000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Date de début requise")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Date de fin requise")]
        public DateTime EndDate { get; set; }

        // ✅ CHANGÉ EN OPTIONNEL
        public int? TeamId { get; set; }

        // ✅ ENLEVÉ [Required] et ajouté valeur par défaut
        public int ProjectStatusId { get; set; } = 1;

        // ✅ ENLEVÉ [Required] et ajouté valeur par défaut
        public int PriorityId { get; set; } = 2;

        // ✅ ENLEVÉ [Required] et [PdfOnly] - on utilise EdbId
        public IFormFile? EdbFile { get; set; }

        public int? ProjectManagerId { get; set; }

        public int? CreatedByUserId { get; set; }
    }
}
