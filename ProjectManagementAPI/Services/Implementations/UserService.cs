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
                // Vérifier si username existe
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserName == dto.UserName || u.Email == dto.Email);

                if (existingUser != null)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Nom d'utilisateur ou email déjà utilisé"
                    };
                }

                var user = new User
                {
                    UserName = dto.UserName,
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    PasswordHash = BC.HashPassword(dto.Password),
                    IsActive = true,
                    MustChangePassword = true,
                    AccountDeadline = dto.AccountDeadline,
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
                return new ApiResponse<UserDTO>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<UserDTO>> UpdateUserAsync(UpdateUserDTO dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(dto.UserId);

                if (user == null)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                if (dto.UserName != null) user.UserName = dto.UserName;
                if (dto.Email != null) user.Email = dto.Email;
                if (dto.FirstName != null) user.FirstName = dto.FirstName;
                if (dto.LastName != null) user.LastName = dto.LastName;
                if (dto.AccountDeadline.HasValue) user.AccountDeadline = dto.AccountDeadline;

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
                return new ApiResponse<UserDTO>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<UserDTO>> GetUserByIdAsync(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Role)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Data = MapToUserDTO(user)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<UserDTO>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<UserDTO>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Role)
                    .Select(u => MapToUserDTO(u))
                    .ToListAsync();

                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Data = users
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserDTO>>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<UserDTO>>> SearchUsersAsync(SearchUsersDTO dto)
        {
            try
            {
                var query = _context.Users
                    .Include(u => u.TeamMembers)
                        .ThenInclude(tm => tm.Role)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(dto.SearchTerm))
                {
                    query = query.Where(u =>
                        u.UserName.Contains(dto.SearchTerm) ||
                        u.Email.Contains(dto.SearchTerm) ||
                        u.FirstName.Contains(dto.SearchTerm) ||
                        u.LastName.Contains(dto.SearchTerm));
                }

                if (dto.IsActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == dto.IsActive.Value);
                }

                if (dto.RoleId.HasValue)
                {
                    query = query.Where(u => u.TeamMembers.Any(tm => tm.RoleId == dto.RoleId.Value));
                }

                var users = await query.Select(u => MapToUserDTO(u)).ToListAsync();

                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Data = users
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserDTO>>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> ToggleUserActiveAsync(int userId, bool isActive)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

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
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> SetAccountDeadlineAsync(int userId, DateTime? deadline)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                user.AccountDeadline = deadline;
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
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDTO dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                // Vérifier ancien mot de passe
                if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Mot de passe actuel incorrect"
                    };
                }

                // Mettre à jour mot de passe
                user.PasswordHash = BC.HashPassword(dto.NewPassword);
                user.MustChangePassword = false; // Plus besoin de changer
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Mot de passe changé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> ForgotPasswordAsync(string email)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    // Ne pas révéler si l'email existe (sécurité)
                    return new ApiResponse<bool>
                    {
                        Success = true,
                        Message = "Si cet email existe, un lien de réinitialisation a été envoyé"
                    };
                }

                // Générer token
                user.PasswordResetToken = Guid.NewGuid().ToString();
                user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Expire dans 1h

                await _context.SaveChangesAsync();

                // TODO: Envoyer email avec token
                // await _emailService.SendPasswordResetEmail(user.Email, user.PasswordResetToken);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Si cet email existe, un lien de réinitialisation a été envoyé",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordDTO dto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email == dto.Email &&
                    u.PasswordResetToken == dto.Token);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Token invalide ou expiré"
                    };
                }

                // Vérifier expiration
                if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Token expiré"
                    };
                }

                // Réinitialiser mot de passe
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
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> CheckAccountValidityAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                // Vérifier si compte actif
                if (!user.IsActive)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Compte désactivé"
                    };
                }

                // Vérifier deadline
                if (user.AccountDeadline.HasValue && user.AccountDeadline < DateTime.UtcNow)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Compte expiré"
                    };
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}"
                };
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
                AccountDeadline = user.AccountDeadline,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user.TeamMembers.Select(tm => tm.Role.RoleName).Distinct().ToList()
            };
        }
    }
}

