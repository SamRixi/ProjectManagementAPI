using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Implementations;
using LoginRequest = ProjectManagementAPI.DTOs.LoginRequest;
using RegisterRequest = ProjectManagementAPI.DTOs.RegisterRequest;
using ForgotPasswordRequest = ProjectManagementAPI.DTOs.ForgotPasswordRequest;
using ResetPasswordRequest = ProjectManagementAPI.DTOs.ResetPasswordRequest;

namespace ProjectManagementAPI.Controllers
{
    /// <summary>
    /// AuthController - Gère l'authentification et la gestion des comptes utilisateurs
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        // ============= LOGIN =============
        /// <summary>
        /// Authentifie un utilisateur et retourne un JWT token
        /// </summary>
        /// <param name="request">Username et Password</param>
        /// <returns>JWT Token + Données utilisateur</returns>
        /// <response code="200">Authentification réussie</response>
        /// <response code="401">Identifiants invalides</response>
        /// <response code="400">Données de requête invalides</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            try
            {
                var response = await _authService.LoginAsync(request);

                if (response.Success)
                {
                    return Ok(response);
                }
                else
                {
                    return Unauthorized(response);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur serveur lors de l'authentification",
                    error = ex.Message
                });
            }
        }

        // ============= REGISTER =============
        /// <summary>
        /// Crée un nouveau compte utilisateur
        /// </summary>
        /// <param name="request">Informations du nouvel utilisateur</param>
        /// <returns>Confirmation d'inscription</returns>
        /// <response code="200">Inscription réussie</response>
        /// <response code="400">Données invalides ou utilisateur déjà existant</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            try
            {
                // ✅ The AuthService handles role assignment
                var response = await _authService.RegisterAsync(request);

                if (response.Success)
                {
                    return Ok(response);
                }
                else
                {
                    return BadRequest(response);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur serveur lors de l'inscription",
                    error = ex.Message
                });
            }
        }

        // ============= FORGOT PASSWORD =============
        /// <summary>
        /// Demande de réinitialisation de mot de passe
        /// </summary>
        /// <param name="request">Email de l'utilisateur</param>
        /// <returns>Confirmation d'envoi du lien de réinitialisation</returns>
        /// <response code="200">Email de réinitialisation envoyé</response>
        /// <response code="404">Utilisateur non trouvé</response>
        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email invalide"
                });
            }

            try
            {
                var response = await _authService.ForgotPasswordAsync(request);

                if (response.Success)
                {
                    return Ok(response);
                }
                else
                {
                    return NotFound(response);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la demande de réinitialisation",
                    error = ex.Message
                });
            }
        }

        // ============= RESET PASSWORD =============
        /// <summary>
        /// Réinitialise le mot de passe avec un token valide
        /// </summary>
        /// <param name="request">Token et nouveau mot de passe</param>
        /// <returns>Confirmation de réinitialisation</returns>
        /// <response code="200">Mot de passe réinitialisé avec succès</response>
        /// <response code="400">Token invalide ou expiré</response>
        [HttpPost("reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides"
                });
            }

            try
            {
                var response = await _authService.ResetPasswordAsync(request);

                if (response.Success)
                {
                    return Ok(response);
                }
                else
                {
                    return BadRequest(response);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la réinitialisation",
                    error = ex.Message
                });
            }
        }
    }
}

