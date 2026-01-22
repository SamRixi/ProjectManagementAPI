using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateTaskDTO
    {
        [Required]
        public int TaskId { get; set; }

        [StringLength(200)]
        public string? TaskName { get; set; }

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(0, 100)]
        public int? Progress { get; set; }

        public int? TaskStatusId { get; set; }
        public int? PriorityId { get; set; }
    }
}
