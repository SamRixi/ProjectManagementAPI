using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class Project
    {
        public int ProjectId { get; set; }

        [Required]
        [StringLength(200)]
        public string ProjectName { get; set; }

        public string? Description { get; set; }  // ✅ Nullable

        public DateTime? StartDate { get; set; }  // ✅ Nullable
        public DateTime? EndDate { get; set; }    // ✅ Nullable

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? CreatedByUserId { get; set; }  // ✅ Nullable (déjà bon)

        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100.")]
        public int Progress { get; set; } = 0;

        // ✅ Tous les FK deviennent nullable
        public int? TeamId { get; set; }
        public int? ProjectStatusId { get; set; }
        public int? PriorityId { get; set; }
        public int? ProjectManagerId { get; set; }

        // Navigation properties
        public User? CreatedByUser { get; set; }
        public ProjectStatus? ProjectStatus { get; set; }
        public Team? Team { get; set; }
        public Priority? Priority { get; set; }
        public User? ProjectManager { get; set; }

        public ICollection<EDB> EDBs { get; set; } = new List<EDB>();
        public ICollection<ProjectTask> ProjectTasks { get; set; } = new List<ProjectTask>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
