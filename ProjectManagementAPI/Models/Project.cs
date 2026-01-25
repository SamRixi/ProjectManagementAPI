using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class Project
    {
        public int ProjectId { get; set; } // Primary key
        public string ProjectName { get; set; } // Name of the project
        public string Description { get; set; } // Description of the project
        public DateTime StartDate { get; set; } // Start date of the project
        public DateTime EndDate { get; set; } // End date of the project
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public int CreatedByUserId { get; set; }

        // Progression du projet en pourcentage (0-100)
        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100.")]
        public int Progress { get; set; } = 0; // Progress percentage of the project

        public int TeamId { get; set; } // Foreign key to Team
        public int ProjectStatusId { get; set; } // Foreign key to ProjectStatus
        public int PriorityId { get; set; } // Foreign key to Priority
        public User CreatedByUser { get; set; }

        // Relations
        public ProjectStatus ProjectStatus { get; set; } // Navigation property to ProjectStatus
        public Team Team { get; set; } // Navigation property to Team
        public Priority Priority { get; set; } // Navigation property to Priority
        public ICollection<EDB> EDBs { get; set; } = new List<EDB>(); // Relation to EDBs
        public ICollection<ProjectTask> ProjectTasks { get; set; } = new List<ProjectTask>();
        public ICollection<Notification> Notifications { get; set; }



    }
}
