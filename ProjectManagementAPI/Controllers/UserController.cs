using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
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
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService; // ✅ NOUVEAU

        public UserController(
            IUserService userService,
            ApplicationDbContext context,
            INotificationService notificationService) // ✅ NOUVEAU
        {
            _userService = userService;
            _context = context;
            _notificationService = notificationService; // ✅ NOUVEAU
        }

        // ============= CRUD =============

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

        // ============= GET USERS BY ROLE ID =============
        [HttpGet("by-role/{roleId}")]
        [Authorize]
        public async Task<IActionResult> GetUsersByRole(int roleId)
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.RoleId == roleId && u.IsActive)
                    .Select(u => new
                    {
                        u.UserId,
                        u.UserName,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        RoleName = u.Role.RoleName
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = users,
                    message = $"{users.Count} utilisateur(s) trouvé(s)"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des utilisateurs",
                    error = ex.Message
                });
            }
        }

        // ============= GET USERS BY ROLE NAME =============
        [HttpGet("by-role-name/{roleName}")]
        [Authorize]
        public async Task<IActionResult> GetUsersByRoleName(string roleName)
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Role.RoleName == roleName && u.IsActive)
                    .Select(u => new
                    {
                        u.UserId,
                        u.UserName,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        RoleName = u.Role.RoleName
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = users,
                    message = $"{users.Count} utilisateur(s) trouvé(s)"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des utilisateurs",
                    error = ex.Message
                });
            }
        }

        [HttpGet("search")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> SearchUsers([FromQuery] SearchUsersDTO dto)
        {
            var result = await _userService.SearchUsersAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Account Management =============

        [HttpPatch("{userId}/toggle-active")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ToggleUserActive(int userId)
        {
            try
            {
                var userResult = await _userService.GetUserByIdAsync(userId);
                if (!userResult.Success)
                    return NotFound(new { success = false, message = "Utilisateur introuvable" });

                var userData = userResult.Data;
                bool currentStatus = false;
                var isActiveProp = userData?.GetType().GetProperty("IsActive");
                if (isActiveProp != null)
                    currentStatus = (bool)(isActiveProp.GetValue(userData) ?? false);

                var result = await _userService.ToggleUserActiveAsync(userId, !currentStatus);

                if (result.Success)
                    return Ok(new
                    {
                        success = true,
                        message = !currentStatus
                            ? "Utilisateur activé avec succès"
                            : "Utilisateur désactivé avec succès",
                        data = result.Data
                    });

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
            return Ok(result);
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest dto)
        {
            var result = await _userService.ResetPasswordAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Temporary Password =============

        [HttpPost("{userId}/generate-temp-password")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> GenerateTemporaryPassword(int userId)
        {
            var result = await _userService.GenerateTemporaryPasswordAsync(userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ============= APPROVE USER ============= ✅ + Notification
        [HttpPut("{userId}/approve")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ApproveUser(int userId, [FromBody] ApproveUserDTO dto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                    return NotFound(new { success = false, message = "Utilisateur introuvable" });

                if (user.IsActive)
                    return BadRequest(new { success = false, message = "Utilisateur déjà approuvé" });

                user.RoleId = dto.RoleId;
                user.IsActive = true;
                user.MustChangePassword = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await _context.Entry(user).Reference(u => u.Role).LoadAsync();

                // ✅ Notification — Compte approuvé
                await _notificationService.CreateNotificationAsync(
                    userId: user.UserId,
                    title: "✅ Compte approuvé !",
                    message: $"Bienvenue {user.FirstName} {user.LastName} ! Votre compte a été approuvé avec le rôle {user.Role?.RoleName}. Vous pouvez maintenant vous connecter.",
                    type: "Success"
                );

                return Ok(new
                {
                    success = true,
                    message = $"Compte de {user.UserName} approuvé avec le rôle {user.Role?.RoleName}",
                    data = new
                    {
                        userId = user.UserId,
                        userName = user.UserName,
                        roleName = user.Role?.RoleName,
                        mustChangePassword = user.MustChangePassword
                    }
                });
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

        // ============= REJECT USER =============
        [HttpDelete("{userId}/reject")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> RejectUser(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound(new { success = false, message = "Utilisateur introuvable" });

                if (user.IsActive)
                    return BadRequest(new
                    {
                        success = false,
                        message = "Impossible de rejeter un utilisateur déjà actif"
                    });

                // ❌ Pas de notification — utilisateur supprimé
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Demande de {user.UserName} rejetée avec succès"
                });
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

        // ============= DELETE USER =============
        [HttpDelete("{userId}")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                var userResult = await _userService.GetUserByIdAsync(userId);
                if (!userResult.Success)
                    return NotFound(new { success = false, message = "Utilisateur introuvable" });

                var userData = userResult.Data;
                var isActiveProp = userData?.GetType().GetProperty("IsActive");

                if (isActiveProp != null)
                {
                    bool isActive = (bool)(isActiveProp.GetValue(userData) ?? false);
                    if (isActive)
                        return BadRequest(new
                        {
                            success = false,
                            message = "Impossible de supprimer un utilisateur actif. Désactivez-le d'abord."
                        });
                }

                var result = await _userService.DeleteUserAsync(userId);
                if (result.Success)
                    return Ok(new { success = true, message = "Utilisateur supprimé définitivement" });

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
