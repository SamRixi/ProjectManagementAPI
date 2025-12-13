using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class ProjectStatus
    {
        public int ProjectStatusId { get; set; } // Primary key
        [Required(ErrorMessage = "Le nom du statut est obligatoire")]
        [StringLength(50)]
        public string StatusName { get; set; } // Name of the status (e.g L UI)
                                              
                                               // couleur d affichage du statut
                                               // exemple : #FF5733 pour une couleur orange En cours 
                                               // #33FF57 pour une couleur verte Terminé
        [StringLength(7)]
        public String Color { get; set; } // Color code for the status (e.g., #FF5733)

        // Relations
        public ICollection<Project> Projects { get; set; } = new List<Project>(); // Relation to Projects


    }
}
