using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateUserDTO
    {
        [Required]
        public int UserId { get; set; }

        [StringLength(50)]
        public string? UserName { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        public int? RoleId { get; set; }  //  - Change user role

      
    }
}
