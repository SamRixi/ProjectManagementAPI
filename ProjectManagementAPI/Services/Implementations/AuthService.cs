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

        // ============= LOGIN =============
        public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserName == request.Username);

                if (user == null)
                {
                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = "Nom d'utilisateur ou mot de passe incorrect"
                    };
                }

                // ✅ AMÉLIORATION: Distinguer "en attente" vs "désactivé"
                if (!user.IsActive)
                {
                    // Check if it's a new registration (never logged in)
                    bool isNewRegistration = !user.LastLoginAt.HasValue;

                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = isNewRegistration
                            ? "Votre compte est en attente d'approbation par un administrateur."
                            : "Votre compte a été désactivé. Contactez l'administrateur."
                    };
                }

                if (user.AccountDeadline.HasValue && user.AccountDeadline.Value < DateTime.UtcNow)
                {
                    return new ApiResponse<LoginResponse>
                    {
                        Success = false,
                        Message = "Votre compte a expiré. Contactez l'administrateur."
                    };
                }

                bool isPasswordValid = BC.Verify(request.Password, user.PasswordHash);

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
                        RoleName = user.Role.RoleName,
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
                return new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Erreur lors de la connexion. Veuillez réessayer."
                };
            }
        }

        // ============= REGISTER ============= ✅ FIXED WITH APPROVAL SYSTEM
        public async Task<ApiResponse<UserDTO>> RegisterAsync(RegisterRequest request)
        {
            try
            {
                // Validate passwords match
                if (!string.IsNullOrEmpty(request.ConfirmPassword) &&
                    request.Password != request.ConfirmPassword)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Les mots de passe ne correspondent pas"
                    };
                }

                // Check if username exists
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

                // Check if email already exists
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

                // ✅ Get Developer role (default for public registration)
                var developerRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "Developer");

                if (developerRole == null)
                {
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "Erreur de configuration: Rôle Developer introuvable"
                    };
                }

                // Hash password
                string hashedPassword = BC.HashPassword(request.Password);

                // ✅ FIXED: Create new user (INACTIVE - requires approval)
                var newUser = new User
                {
                    UserName = request.Username,
                    Email = request.Email,
                    PasswordHash = hashedPassword,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    RoleId = developerRole.RoleId,
                    IsActive = false,  // ✅ CORRIGÉ - Désactivé par défaut (requires approval)
                    MustChangePassword = false,
                    CreatedAt = DateTime.UtcNow
                };

                // Save to database
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ New user registered: {newUser.UserName} (ID: {newUser.UserId}) - Pending approval");

                // Return UserDTO
                var userDto = new UserDTO
                {
                    UserId = newUser.UserId,
                    UserName = newUser.UserName,
                    Email = newUser.Email,
                    FirstName = newUser.FirstName,
                    LastName = newUser.LastName,
                    RoleName = developerRole.RoleName,
                    IsActive = newUser.IsActive,
                    MustChangePassword = newUser.MustChangePassword,
                    CreatedAt = newUser.CreatedAt
                };

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Inscription réussie! Votre compte sera activé après approbation par un administrateur.",  // ✅ Message mis à jour
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Registration error: {ex.Message}");
                return new ApiResponse<UserDTO>
                {
                    Success = false,
                    Message = "Erreur lors de l'inscription. Veuillez réessayer."
                };
            }
        }

        // ============= GENERATE JWT TOKEN =============
        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

            var tokenHandler = new JwtSecurityTokenHandler();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.RoleName),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName)
            };

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

        // ============= CHANGE PASSWORD =============
        public async Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordDTO dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mot de passe actuel incorrect"
                    };
                }

                user.PasswordHash = BC.HashPassword(dto.NewPassword);
                user.MustChangePassword = false;

                await _context.SaveChangesAsync();

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "Mot de passe changé avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Erreur lors du changement de mot de passe"
                };
            }
        }

        // ============= FORGOT PASSWORD =============
        public async Task<ApiResponse<object>> ForgotPasswordAsync(ForgotPasswordRequest dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    return new ApiResponse<object>
                    {
                        Success = true,
                        Message = "Si l'email existe, un lien de réinitialisation a été envoyé"
                    };
                }

                var token = Guid.NewGuid().ToString();
                var resetToken = new PasswordResetToken
                {
                    UserId = user.UserId,
                    Token = token,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    IsUsed = false
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                // TODO: Send email with reset link

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "Email de réinitialisation envoyé"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Erreur lors de l'envoi de l'email"
                };
            }
        }

        // ============= RESET PASSWORD =============
        public async Task<ApiResponse<object>> ResetPasswordAsync(ResetPasswordRequest dto)
        {
            try
            {
                var resetToken = await _context.PasswordResetTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt =>
                        rt.Token == dto.Token &&
                        rt.User.Email == dto.Email &&
                        rt.ExpiresAt > DateTime.UtcNow &&
                        !rt.IsUsed);

                if (resetToken == null)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token invalide ou expiré"
                    };
                }

                resetToken.User.PasswordHash = BC.HashPassword(dto.NewPassword);
                resetToken.IsUsed = true;

                await _context.SaveChangesAsync();

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "Mot de passe réinitialisé avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Erreur lors de la réinitialisation"
                };
            }
        }
    }
}
