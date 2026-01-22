using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateTeamDTO
    {
        [Required(ErrorMessage = "Le nom de l'équipe est obligatoire")]
        [StringLength(100)] 
        public string TeamName { get; set; }

        public string? Description { get; set; }
    }
}
