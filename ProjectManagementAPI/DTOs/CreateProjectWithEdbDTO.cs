using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ProjectManagementAPI.DTOs
{
    public class CreateProjectWithEdbDTO
    {
        [Required(ErrorMessage = "Nom du projet requis")]
        [StringLength(200, MinimumLength = 3)]
        public string ProjectName { get; set; }

        [Required(ErrorMessage = "Description requise")]
        [StringLength(1000)]
        public string Description { get; set; }

        [Required(ErrorMessage = "Date de début requise")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Date de fin requise")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Équipe requise")]
        public int TeamId { get; set; }

        [Required(ErrorMessage = "Statut requis")]
        public int ProjectStatusId { get; set; }

        [Required(ErrorMessage = "Priorité requise")]
        public int PriorityId { get; set; }

        [Required(ErrorMessage = "Fichier EDB requis")]
        [PdfOnly]
        public IFormFile EdbFile { get; set; }  // ✅ FIXED: Upload file, not ID
    }
}
