using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.Models
{
    public class Comment
    {
        public int CommentId { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }

        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ProjectTask ProjectTask { get; set; } = null!;
        public User CreatedByUser { get; set; }=null!;


    }
}
