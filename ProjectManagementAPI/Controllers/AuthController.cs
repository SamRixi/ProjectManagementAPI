using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Implementations;


namespace ProjectManagementAPI.Controllers
{
    /// <summary>
    /// AuthController - Gère les endpoints d'authentification
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        // ============= LOGIN =============
        /// <summary>
        /// Endpoint: POST /api/auth/login
        /// Authentifie un utilisateur et retourne un JWT token
        /// </summary>
        /// <param name="request">Username et Password</param>
        /// <returns>JWT Token + Données utilisateur</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Validation basique
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username et Password sont obligatoires" });
            }

            // Appeler le service
            var response = await _authService.LoginAsync(request);

            // Retourner la réponse
            if (response.Success)
            {
                return Ok(response);
            }
            else
            {
                return Unauthorized(response);
            }
        }

        // ============= REGISTER =============
        /// <summary>
        /// Endpoint: POST /api/auth/register
        /// Crée un nouvel utilisateur
        /// </summary>
        /// <param name="request">Username, Password, FirstName, LastName</param>
        /// <returns>Confirmation d'inscription</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Validation basique
            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.FirstName) ||
                string.IsNullOrEmpty(request.LastName))
            {
                return BadRequest(new { message = "Tous les champs sont obligatoires" });
            }

            // Vérifier la longueur du mot de passe
            if (request.Password.Length < 6)
            {
                return BadRequest(new { message = "Le mot de passe doit avoir au moins 6 caractères" });
            }

            // Appeler le service
            var response = await _authService.RegisterAsync(request);

            // Retourner la réponse
            if (response.Success)
            {
                return Ok(response);
            }
            else
            {
                return BadRequest(response);
            }
        }
    }
}