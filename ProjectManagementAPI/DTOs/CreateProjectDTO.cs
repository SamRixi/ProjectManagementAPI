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

        [Required(ErrorMessage = "Date de début requise")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Date de fin requise")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Statut requis")]
        public int ProjectStatusId { get; set; }

        [Required(ErrorMessage = "Priorité requise")]
        public int PriorityId { get; set; }

        [Required(ErrorMessage = "Équipe requise")]
     
        public int TeamId { get; set; }
  
    }
}
