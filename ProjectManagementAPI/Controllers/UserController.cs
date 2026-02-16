using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // ============= CRUD (Reporting uniquement) =============

        [HttpPost]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO dto)
        {
            var result = await _userService.CreateUserAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{userId}")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDTO dto)
        {
            dto.UserId = userId;
            var result = await _userService.UpdateUserAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userService.GetAllUsersAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{userId}")]
        [Authorize]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userService.GetUserByIdAsync(userId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("search")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> SearchUsers([FromQuery] SearchUsersDTO dto)
        {
            var result = await _userService.SearchUsersAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Account Management (Reporting) =============

        /// <summary>
        /// Toggle le statut actif/inactif d'un utilisateur (automatique)
        /// </summary>
        [HttpPatch("{userId}/toggle-active")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ToggleUserActive(int userId)
        {
            try
            {
                // Récupère l'utilisateur pour connaître son statut actuel
                var userResult = await _userService.GetUserByIdAsync(userId);

                if (!userResult.Success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Utilisateur introuvable"
                    });
                }

                // Extrait le statut actuel
                var userData = userResult.Data;
                bool currentStatus = false;

                var isActiveProp = userData?.GetType().GetProperty("IsActive");
                if (isActiveProp != null)
                {
                    currentStatus = (bool)(isActiveProp.GetValue(userData) ?? false);
                }

                // Toggle le statut (inverse)
                var result = await _userService.ToggleUserActiveAsync(userId, !currentStatus);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = !currentStatus ? "Utilisateur activé avec succès" : "Utilisateur désactivé avec succès",
                        data = result.Data
                    });
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors du changement de statut",
                    error = ex.Message
                });
            }
        }

        [HttpPut("{userId}/deadline")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> SetAccountDeadline(int userId, [FromBody] DateTime? deadline)
        {
            var result = await _userService.SetAccountDeadlineAsync(userId, deadline);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Password Management =============

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userService.ChangePasswordAsync(userId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest dto)
        {
            var result = await _userService.ForgotPasswordAsync(dto.Email);
            return Ok(result); // Always return 200 for security
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest dto)
        {
            var result = await _userService.ResetPasswordAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Temporary Password (Reporting / Manager) =============

        [HttpPost("{userId}/generate-temp-password")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> GenerateTemporaryPassword(int userId)
        {
            var result = await _userService.GenerateTemporaryPasswordAsync(userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // ============= APPROVE/REJECT NEW REGISTRATIONS =============

        /// <summary>
        /// Approuve un utilisateur en attente (active son compte)
        /// </summary>
        [HttpPut("{userId}/approve")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ApproveUser(int userId)
        {
            try
            {
                var userResult = await _userService.GetUserByIdAsync(userId);

                if (!userResult.Success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Utilisateur introuvable"
                    });
                }

                // Activate the user account
                var result = await _userService.ToggleUserActiveAsync(userId, true);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Compte approuvé et activé avec succès"
                    });
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'approbation",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Rejette une demande d'inscription (supprime l'utilisateur inactif)
        /// </summary>
        [HttpDelete("{userId}/reject")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> RejectUser(int userId)
        {
            try
            {
                var userResult = await _userService.GetUserByIdAsync(userId);

                if (!userResult.Success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Utilisateur introuvable"
                    });
                }

                // Check if user is already active (can't reject active users)
                var userData = userResult.Data;
                var isActiveProp = userData?.GetType().GetProperty("IsActive");

                if (isActiveProp != null)
                {
                    bool isActive = (bool)(isActiveProp.GetValue(userData) ?? false);

                    if (isActive)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Impossible de rejeter un utilisateur déjà actif"
                        });
                    }
                }

                // Delete the pending registration
                var result = await _userService.DeleteUserAsync(userId);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Demande d'inscription rejetée avec succès"
                    });
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors du rejet",
                    error = ex.Message
                });
            }
        }

        // ============= DELETE USER (Permanent Delete) ============= ✅ AJOUTÉ

        /// <summary>
        /// Supprime définitivement un utilisateur (seulement si inactif)
        /// </summary>
        [HttpDelete("{userId}")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                var userResult = await _userService.GetUserByIdAsync(userId);

                if (!userResult.Success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Utilisateur introuvable"
                    });
                }

                // Vérifier que l'utilisateur n'est pas actif (sécurité)
                var userData = userResult.Data;
                var isActiveProp = userData?.GetType().GetProperty("IsActive");

                if (isActiveProp != null)
                {
                    bool isActive = (bool)(isActiveProp.GetValue(userData) ?? false);

                    if (isActive)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Impossible de supprimer un utilisateur actif. Désactivez-le d'abord."
                        });
                    }
                }

                // Suppression permanente
                var result = await _userService.DeleteUserAsync(userId);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Utilisateur supprimé définitivement"
                    });
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la suppression",
                    error = ex.Message
                });
            }
        }
    }
}
