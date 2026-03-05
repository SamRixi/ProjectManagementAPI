using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using BC = BCrypt.Net.BCrypt;

namespace ProjectManagementAPI.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<UserDTO>> CreateUserAsync(CreateUserDTO dto)
        {
            try
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserName == dto.UserName || u.Email == dto.Email);

                if (existingUser != null)
                    return new ApiResponse<UserDTO> { Success = false, Message = "Nom d'utilisateur ou email déjà utilisé" };

                var user = new User
                {
                    UserName = dto.UserName,
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    PasswordHash = BC.HashPassword(dto.Password),
                    RoleId = dto.RoleId,
                    IsActive = true,
                    MustChangePassword = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Utilisateur créé avec succès",
                    Data = MapToUserDTO(user)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<UserDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<UserDTO>> UpdateUserAsync(UpdateUserDTO dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                    return new ApiResponse<UserDTO> { Success = false, Message = "Utilisateur introuvable" };

                if (dto.UserName != null) user.UserName = dto.UserName;
                if (dto.Email != null) user.Email = dto.Email;
                if (dto.FirstName != null) user.FirstName = dto.FirstName;
                if (dto.LastName != null) user.LastName = dto.LastName;
                if (dto.RoleId.HasValue) user.RoleId = dto.RoleId.Value;

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Utilisateur mis à jour",
                    Data = MapToUserDTO(user)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<UserDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<UserDTO>> GetUserByIdAsync(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Team)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                    return new ApiResponse<UserDTO> { Success = false, Message = "Utilisateur introuvable" };

                return new ApiResponse<UserDTO> { Success = true, Data = MapToUserDTO(user) };
            }
            catch (Exception ex)
            {
                return new ApiResponse<UserDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<List<UserDTO>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Team)
                    .ToListAsync();

                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Data = users.Select(u => MapToUserDTO(u)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<List<UserDTO>>> SearchUsersAsync(SearchUsersDTO dto)
        {
            try
            {
                var query = _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Team)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(dto.SearchTerm))
                    query = query.Where(u =>
                        u.UserName.Contains(dto.SearchTerm) ||
                        u.Email.Contains(dto.SearchTerm) ||
                        u.FirstName.Contains(dto.SearchTerm) ||
                        u.LastName.Contains(dto.SearchTerm));

                if (dto.IsActive.HasValue)
                    query = query.Where(u => u.IsActive == dto.IsActive.Value);

                if (dto.RoleId.HasValue)
                    query = query.Where(u => u.RoleId == dto.RoleId.Value);

                var users = await query.ToListAsync();

                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Data = users.Select(u => MapToUserDTO(u)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> ToggleUserActiveAsync(int userId, bool isActive)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                user.IsActive = isActive;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = isActive ? "Compte activé" : "Compte désactivé",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> SetAccountDeadlineAsync(int userId, DateTime? deadline)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Date d'expiration mise à jour",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDTO dto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
                    return new ApiResponse<bool> { Success = false, Message = "Mot de passe actuel incorrect" };

                bool wasMustChange = user.MustChangePassword;

                user.PasswordHash = BC.HashPassword(dto.NewPassword);
                user.MustChangePassword = false;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                if (wasMustChange)
                {
                    var reportingUsers = await _context.Users
                        .Include(u => u.Role)
                        .Where(u => u.Role.RoleName == "Reporting" && u.IsActive)
                        .ToListAsync();

                    foreach (var reportingUser in reportingUsers)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            UserId = reportingUser.UserId,
                            Title = "🔔 Utilisateur reconnecté",
                            Message = $"{user.FirstName} {user.LastName} est de retour et a changé son mot de passe avec succès.",
                            Type = "Info",
                            RelatedUserId = user.UserId,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Mot de passe changé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> ForgotPasswordAsync(string email)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (user != null)
                {
                    user.PasswordResetToken = Guid.NewGuid().ToString();
                    user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
                    await _context.SaveChangesAsync();
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Si cet email existe, un lien de réinitialisation a été envoyé",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest dto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email == dto.Email &&
                    u.PasswordResetToken == dto.Token);

                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Token invalide ou expiré" };

                if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
                    return new ApiResponse<bool> { Success = false, Message = "Token expiré" };

                user.PasswordHash = BC.HashPassword(dto.NewPassword);
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                user.MustChangePassword = false;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Mot de passe réinitialisé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<bool>> CheckAccountValidityAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                if (!user.IsActive)
                    return new ApiResponse<bool> { Success = false, Message = "Compte désactivé" };

                return new ApiResponse<bool> { Success = true, Data = true };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task<ApiResponse<string>> GenerateTemporaryPasswordAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<string> { Success = false, Message = "Utilisateur introuvable" };

                string tempPassword = GenerateRandomPassword();
                user.PasswordHash = BC.HashPassword(tempPassword);
                user.MustChangePassword = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<string>
                {
                    Success = true,
                    Message = "Mot de passe temporaire généré avec succès",
                    Data = tempPassword
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<string> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        public async Task UpdateLastLoginAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // ✅ FIX FINAL : RejectUserAsync — gère tous les Restrict + NoAction
        public async Task<ApiResponse<bool>> RejectUserAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                // 1. Nullifier RelatedUserId dans les notifications
                var notifsRelated = await _context.Notifications
                    .Where(n => n.RelatedUserId == userId)
                    .ToListAsync();
                foreach (var n in notifsRelated)
                    n.RelatedUserId = null;

                // 2. Supprimer les notifications dont cet user est destinataire
                var notifsOwned = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();
                _context.Notifications.RemoveRange(notifsOwned);

                // 3. Supprimer les PasswordResetTokens
                var tokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == userId)
                    .ToListAsync();
                _context.PasswordResetTokens.RemoveRange(tokens);

                // 4. Supprimer les TeamMembers
                var teamMembers = await _context.TeamMembers
                    .Where(tm => tm.UserId == userId)
                    .ToListAsync();
                _context.TeamMembers.RemoveRange(teamMembers);

                // 5. Nullifier AssignedToUserId dans les tâches
                var assignedTasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .ToListAsync();
                foreach (var t in assignedTasks)
                    t.AssignedToUserId = null;

                // 6. Nullifier CreatedByUserId dans les tâches
                var createdTasks = await _context.ProjectTasks
                    .Where(t => t.CreatedByUserId == userId)
                    .ToListAsync();
                foreach (var t in createdTasks)
                    t.CreatedByUserId = null;

                // 7. Nullifier ValidatedByUserId dans les tâches
                var validatedTasks = await _context.ProjectTasks
                    .Where(t => t.ValidatedByUserId == userId)
                    .ToListAsync();
                foreach (var t in validatedTasks)
                    t.ValidatedByUserId = null;

                // 8. Nullifier ProjectManagerId dans les projets
                var managedProjects = await _context.Projects
                    .Where(p => p.ProjectManagerId == userId)
                    .ToListAsync();
                foreach (var p in managedProjects)
                    p.ProjectManagerId = null;

                // 9. Nullifier CreatedByUserId dans les projets
                var createdProjects = await _context.Projects
                    .Where(p => p.CreatedByUserId == userId)
                    .ToListAsync();
                foreach (var p in createdProjects)
                    p.CreatedByUserId = null;

                // 10. Nullifier CreatedByUserId dans les commentaires
                var comments = await _context.Comments
                    .Where(c => c.CreatedByUserId == userId)
                    .ToListAsync();
                foreach (var c in comments)
                    c.CreatedByUserId = null;

                // 11. Sauvegarder tous les NULL
                await _context.SaveChangesAsync();

                // 12. Supprimer l'utilisateur
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Utilisateur rejeté et supprimé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ✅ FIX : DeleteUserAsync — même logique que RejectUserAsync
        public async Task<ApiResponse<bool>> DeleteUserAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                // 1. Nullifier RelatedUserId
                var notifsRelated = await _context.Notifications
                    .Where(n => n.RelatedUserId == userId)
                    .ToListAsync();
                foreach (var n in notifsRelated)
                    n.RelatedUserId = null;

                // 2. Supprimer notifs destinataire
                var notifsOwned = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();
                _context.Notifications.RemoveRange(notifsOwned);

                // 3. Supprimer tokens
                var tokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == userId)
                    .ToListAsync();
                _context.PasswordResetTokens.RemoveRange(tokens);

                // 4. Supprimer TeamMembers
                var teamMembers = await _context.TeamMembers
                    .Where(tm => tm.UserId == userId)
                    .ToListAsync();
                _context.TeamMembers.RemoveRange(teamMembers);

                // 5-10. Nullifier toutes les FK Restrict
                var assignedTasks = await _context.ProjectTasks.Where(t => t.AssignedToUserId == userId).ToListAsync();
                foreach (var t in assignedTasks) t.AssignedToUserId = null;

                var createdTasks = await _context.ProjectTasks.Where(t => t.CreatedByUserId == userId).ToListAsync();
                foreach (var t in createdTasks) t.CreatedByUserId = null;

                var validatedTasks = await _context.ProjectTasks.Where(t => t.ValidatedByUserId == userId).ToListAsync();
                foreach (var t in validatedTasks) t.ValidatedByUserId = null;

                var managedProjects = await _context.Projects.Where(p => p.ProjectManagerId == userId).ToListAsync();
                foreach (var p in managedProjects) p.ProjectManagerId = null;

                var createdProjects = await _context.Projects.Where(p => p.CreatedByUserId == userId).ToListAsync();
                foreach (var p in createdProjects) p.CreatedByUserId = null;

                var comments = await _context.Comments.Where(c => c.CreatedByUserId == userId).ToListAsync();
                foreach (var c in comments) c.CreatedByUserId = null;

                await _context.SaveChangesAsync();

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Utilisateur supprimé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        private string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        private UserDTO MapToUserDTO(User user)
        {
            return new UserDTO
            {
                UserId = user.UserId,
                UserName = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsActive = user.IsActive,
                MustChangePassword = user.MustChangePassword,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                RoleId = user.RoleId,
                RoleName = user.Role?.RoleName ?? "N/A",
            };
        }
    }
}
