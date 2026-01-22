using Microsoft.IdentityModel.Tokens;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using ProjectManagementAPI.DTOs;
using System.Security.Claims;
using System.Text;

using BC = BCrypt.Net.BCrypt;

namespace ProjectManagementAPI.Services.Implementations
{
    
    public class AuthService
    {
       
        /// AuthService - Gère l'authentification et les JWT tokens
        
  
            private readonly ApplicationDbContext _context;
            private readonly IConfiguration _configuration;

            public AuthService(ApplicationDbContext context, IConfiguration configuration)
            {
                _context = context;
                _configuration = configuration;
            }

            // ============= LOGIN =============
           
            /// Authentifie un utilisateur et retourne un JWT token
            
            public async Task<LoginResponse> LoginAsync(LoginRequest request)
            {
                try
                {
                    // Étape 1: Chercher l'utilisateur par username
                    var user = _context.Users.FirstOrDefault(u => u.UserName == request.Username);

                    // Étape 2: Vérifier si l'utilisateur existe
                    if (user == null)
                    {
                        return new LoginResponse
                        {
                            Success = false,
                            Message = "Utilisateur ou mot de passe incorrect"
                        };
                    }

                    // Étape 3: Vérifier le mot de passe avec BCrypt
                    bool isPasswordValid = BC.Verify(request.Password, user.PasswordHash);

                    if (!isPasswordValid)
                    {
                        return new LoginResponse
                        {
                            Success = false,
                            Message = "Utilisateur ou mot de passe incorrect"
                        };
                    }

                    // Étape 4: Générer le JWT token
                    var token = GenerateJwtToken(user);

                    // Étape 5: Retourner la réponse avec le token
                    return new LoginResponse
                    {
                        Success = true,
                        Message = "Connexion réussie",
                        Token = token,
                        User = new UserResponse
                        {
                            UserId = user.UserId,
                            Username = user.UserName,
                            FirstName = user.FirstName,
                            LastName = user.LastName
                        }
                    };
                }
                catch (Exception ex)
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = $"Erreur lors de la connexion: {ex.Message}"
                    };
                }
            }

            // ============= REGISTER =============
            /// <summary>
            /// Crée un nouvel utilisateur
            /// </summary>
            public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
            {
                try
                {
                    // Étape 1: Vérifier si l'utilisateur existe déjà
                    var existingUser = _context.Users.FirstOrDefault(u => u.UserName == request.Username);

                    if (existingUser != null)
                    {
                        return new RegisterResponse
                        {
                            Success = false,
                            Message = "Cet utilisateur existe déjà"
                        };
                    }

                    // Étape 2: Hasher le mot de passe avec BCrypt
                    string hashedPassword = BC.HashPassword(request.Password);

                    // Étape 3: Créer le nouvel utilisateur
                    var newUser = new User
                    {
                         UserName= request.Username,
                        Email = request.Email,
                        PasswordHash = hashedPassword,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    // Étape 4: Sauvegarder en base de données
                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();
                // Étape 5: Retourner la réponse de succès
                return new RegisterResponse
                    {
                        Success = true,
                        Message = "Inscription réussie",
                        UserId = newUser.UserId
                    };
                }
                catch (Exception ex)
                {
                    return new RegisterResponse
                    {
                        Success = false,
                        Message = $"Erreur lors de l'inscription: {ex.Message}"
                    };
                }
            }

            // ============= GENERATE JWT TOKEN =============
            /// <summary>
            /// Génère un JWT token pour l'utilisateur
            /// </summary>
            private string GenerateJwtToken(User user)
            {
                var jwtSettings = _configuration.GetSection("Jwt");
                var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

                var tokenHandler = new JwtSecurityTokenHandler();
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Name, user.UserName),
                    new Claim("FirstName", user.FirstName),
                    new Claim("LastName", user.LastName)
                }),
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
        }
}
