using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class AssignProjectManagerDTO
    {
        [Required]
        public int UserId { get; set; }
    }
}
