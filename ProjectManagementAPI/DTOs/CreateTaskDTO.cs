using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateTaskDTO
    {
        [Required(ErrorMessage = "Le nom de la tâche est obligatoire")]
        [StringLength(200)]
        public string TaskName { get; set; }

        public string? Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int TaskStatusId { get; set; }

        [Required]
        public int PriorityId { get; set; }

        public int? AssignedToUserId { get; set; } // Optionnel : assignation
    }
}
