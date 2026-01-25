using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateUserDTO
    {
        [Required]
        [StringLength(50)]
        public string UserName { get; set; } = string.Empty;  //  Add default value

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;  //  Add default value

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public int RoleId { get; set; }
        public DateTime? AccountDeadline { get; set; }
    }
}
