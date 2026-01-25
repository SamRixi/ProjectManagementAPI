using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class Notification
    {
        public int NotificationId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [Required]
        [StringLength(1000)]
        public string Message { get; set; }

        [StringLength(50)]
        public string? Type { get; set; }  // "Info", "Warning", "Success", "Error"

        public bool IsRead { get; set; } = false;

        public int? RelatedProjectId { get; set; }  // Optional: Link to project
        public int? RelatedTaskId { get; set; }     // Optional: Link to task

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ReadAt { get; set; }

        // Navigation properties
        public User User { get; set; }
        public Project? RelatedProject { get; set; }
        public ProjectTask? RelatedTask { get; set; }
    }
}