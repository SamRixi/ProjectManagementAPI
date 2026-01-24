using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class CreateUserDTO
    {
        [Required(ErrorMessage = "Nom d'utilisateur requis")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Nom d'utilisateur doit avoir entre 3 et 50 caractères")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "Email requis")]
        [EmailAddress(ErrorMessage = "Format email invalide")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Prénom requis")]
        [StringLength(50, ErrorMessage = "Prénom max 50 caractères")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Nom requis")]
        [StringLength(50, ErrorMessage = "Nom max 50 caractères")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Mot de passe requis")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mot de passe doit avoir entre 6 et 100 caractères")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Rôle requis")]  // ✅ ADDED
        public int RoleId { get; set; }

        public DateTime? AccountDeadline { get; set; }  // ✅ Optional - good
    }
}
