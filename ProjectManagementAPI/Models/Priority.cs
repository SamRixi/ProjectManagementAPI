using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class Priority
    {
      
        /// Classe Priority représente les niveaux de priorité d'une tâche
        /// Valeurs fixes UNIQUEMENT:
        /// - "High" (Priorité élevée - Urgent)
        /// - "Medium" (Priorité moyenne - Normal)
        /// - "Low" (Priorité basse - Peut attendre)
       
       
            public int PriorityId { get; set; }

            
            /// Nom du niveau de priorité
            /// Valeurs acceptées UNIQUEMENT:
            /// - "High" (Priorité élevée)
            /// - "Medium" (Priorité moyenne)
            /// - "Low" (Priorité basse)
           
            [Required(ErrorMessage = "Le nom de la priorité est obligatoire")]
            [StringLength(50)]
            public string Name { get; set; }

        // ============= RELATIONS =============


        /// Liste de toutes les tâches ayant cette priorité
        /// Relation: 1 Priority → * PROject task 
        /// Relation: 1 Priority → * Projects

        public ICollection<ProjectTask> ProjectTasks { get; set; } = new List<ProjectTask>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
        
    }
}
