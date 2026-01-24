using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class LoginRequest
    {

        [Required(ErrorMessage = "Nom d'utilisateur requis")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Mot de passe requis")]
        public string Password { get; set; }
    }
}

