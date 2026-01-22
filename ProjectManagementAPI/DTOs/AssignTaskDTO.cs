using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class AssignTaskDTO
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public int AssignedToUserId { get; set; }
    }
}
