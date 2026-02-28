using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BC = BCrypt.Net.BCrypt;

namespace ProjectManagementAPI.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ============= CHANGE PASSWORD =============
        public async Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordDTO dto)
        {
            try
            {
                // 1) Vérifier confirmation
                if (dto.NewPassword != dto.ConfirmPassword)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Les nouveaux mots de passe ne correspondent pas."
                    };
                }

                // 2) Récupérer l'utilisateur
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable."
                    };
                }

                // 3) Vérifier l'ancien mot de passe
                bool currentValid = BC.Verify(dto.CurrentPassword, user.PasswordHash);
                if (!currentValid)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mot de passe actuel incorrect."
                    };
                }

                // 4) Hasher et enregistrer le nouveau mot de passe
                user.PasswordHash = BC.HashPassword(dto.NewPassword);
                user.MustChangePassword = false; // si tu utilises ce flag
                await _context.SaveChangesAsync();

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "Mot de passe modifié avec succès."
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ChangePasswordAsync error: {ex.Message}");
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Erreur lors du changement de mot de passe."
                };
            }
        }

        public Task<ApiResponse<object>> ForgotPasswordAsync(ForgotPasswordRequest dto)
        {
            throw new NotImplementedException();
        }

        // ============= LOGIN =============
        public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
        {
            try
            {
                Console.WriteLine($"🔐 Login attempt: {request.Username} / {request.Password}");

                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserName == request.Username);

                if (user == null)
                {
                    Console.WriteLine("❌ User not found");
                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = "Nom d'utilisateur ou mot de passe incorrect"
                    };
                }

                Console.WriteLine($"✅ Found user {user.UserName}, active={user.IsActive}");

                if (!user.IsActive)
                {
                    bool isNewRegistration = !user.LastLoginAt.HasValue;

                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = isNewRegistration
                            ? "Votre compte est en attente d'approbation par un administrateur."
                            : "Votre compte a été désactivé. Contactez l'administrateur."
                    };
                }

              

                bool isPasswordValid = BC.Verify(request.Password, user.PasswordHash);
                Console.WriteLine($"🔎 Password valid = {isPasswordValid}");
                Console.WriteLine($"Hash in DB: {user.PasswordHash}");

                if (!isPasswordValid)
                {
                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = "Nom d'utilisateur ou mot de passe incorrect"
                    };
                }

                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(user);

                var loginResponse = new LoginResponse
                {
                    Token = token,
                    User = new UserDTO
                    {
                        UserId = user.UserId,
                        UserName = user.UserName,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        RoleName = user.Role?.RoleName,
                        IsActive = user.IsActive,
                        MustChangePassword = user.MustChangePassword,
                        CreatedAt = user.CreatedAt,
                        LastLoginAt = user.LastLoginAt
                    }
                };

                return new ApiResponse<LoginResponse>
                {
                    Success = true,
                    Message = "Connexion réussie",
                    Data = loginResponse
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Login exception: {ex.Message}");
                return new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Erreur lors de la connexion. Veuillez réessayer."
                };
            }
        }

        // ============= REGISTER =============  (Rôle attribué plus tard par Reporting)
        public async Task<ApiResponse<UserDTO>> RegisterAsync(RegisterRequest request)
        {
            try
            {
                if (!string.IsNullOrEmpty(request.ConfirmPassword) &&
                    request.Password != request.ConfirmPassword)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Les mots de passe ne correspondent pas"
                    };
                }

                var usernameExists = await _context.Users
                    .AnyAsync(u => u.UserName == request.Username);

                if (usernameExists)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Ce nom d'utilisateur existe déjà"
                    };
                }

                var emailExists = await _context.Users
                    .AnyAsync(u => u.Email == request.Email);

                if (emailExists)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Cet email existe déjà"
                    };
                }

                string hashedPassword = BC.HashPassword(request.Password);

                var newUser = new User
                {
                    UserName = request.Username,
                    Email = request.Email,
                    PasswordHash = hashedPassword,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    RoleId = null,
                    IsActive = false,
                    MustChangePassword = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ New user registered: {newUser.UserName} (ID: {newUser.UserId}) - Pending approval, no role yet.");

                var reportingUsers = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Role.RoleName == "Reporting")
                    .ToListAsync();

                foreach (var reportingUser in reportingUsers)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = reportingUser.UserId,
                        Title = "👤 Nouvel utilisateur en attente",
                        Message = $"L'utilisateur '{newUser.FirstName} {newUser.LastName}' s'est inscrit et attend une approbation.",
                        Type = "NEW_USER",
                        RelatedUserId = newUser.UserId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                var userDto = new UserDTO
                {
                    UserId = newUser.UserId,
                    UserName = newUser.UserName,
                    Email = newUser.Email,
                    FirstName = newUser.FirstName,
                    LastName = newUser.LastName,
                    RoleName = null,
                    IsActive = newUser.IsActive,
                    MustChangePassword = newUser.MustChangePassword,
                    CreatedAt = newUser.CreatedAt
                };

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Inscription réussie ! Votre compte sera activé après validation et attribution d'un rôle par un Reporting.",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Registration error:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.StackTrace);

                return new ApiResponse<UserDTO>
                {
                    Success = false,
                    Message = "Erreur lors de l'inscription. Veuillez réessayer."
                };
            }
        }

        public Task<ApiResponse<object>> ResetPasswordAsync(ResetPasswordRequest dto)
        {
            throw new NotImplementedException();
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

            var tokenHandler = new JwtSecurityTokenHandler();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email)
            };

            if (user.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, user.Role.RoleName));
            }

            claims.Add(new Claim("FirstName", user.FirstName ?? string.Empty));
            claims.Add(new Claim("LastName", user.LastName ?? string.Empty));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpireMinutes"])),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // le reste de tes méthodes (ForgotPasswordAsync, ResetPasswordAsync) reste à implémenter...
    }
}
