using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class ProjectTaskStatus
    {
        public int ProjectTaskStatusId { get; set; } // Primary key
                                          // valeur acceptee a faire en cours termine 
        [Required(ErrorMessage = "Le nom du statut est obligatoire")]
        [StringLength(50)]
        public string StatusName { get; set; } // Name of the status (e.g In Progress, Completed)
        // couleur d affichage du statut
        [StringLength(7)]
        public String Color { get; set; } // Color code for the status (e.g., #FF5733)
                                          // Relations
        public ICollection<ProjectTask> ProjectTasks { get; set; }
        }
    }
