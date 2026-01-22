using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class ValidateTaskDTO
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public bool IsValidated { get; set; }
    }
}
