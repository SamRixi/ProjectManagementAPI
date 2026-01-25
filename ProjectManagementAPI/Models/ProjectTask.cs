using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class ProjectTask
    {
        public int ProjectTaskId { get; set; } // Primary key
        public string TaskName { get; set; } // Name of the task
        public string Description { get; set; } // Description of the task
        public DateTime DueDate { get; set; } // Due date of the task
        [Required]
        public int CreatedByUserId { get; set; }

        // progression de la tache en pourcentage (0-100)
        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100.")]
        public int Progress { get; set; } = 0; // Progress percentage of the task
        public bool isValidated { get; set; } = false; // Indicates if the task is validated
                                                       // foreign keys
        public int ProjectId { get; set; } // Foreign key to Project
        public int TaskStatusId { get; set; } // Foreign key to TaskStatus
        public int PriorityId { get; set; } // Foreign key to Priority
        // Relations
        public Project Project { get; set; } // Navigation property to Project
        public ProjectTaskStatus ProjectTasksStatus { get; set; } // Navigation property to TaskStatus
        public Priority Priority { get; set; } // Navigation property to Priority
        public int? AssignedToUserId { get; set; } // Foreign key (nullable if task can be unassigned)
        public User AssignedToUser { get; set; } // Navigation property

        public int? ValidatedByUserId { get; set; }
        public DateTime? ValidatedAt { get; set; }
        public User? ValidatedByUser { get; set; }  // Navigation property
        public ICollection<Comment> Comments { get; set; }
        public User CreatedByUser { get; set; } = null!;
       






    }
}
