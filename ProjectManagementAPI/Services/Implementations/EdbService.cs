using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Linq;
using System.Security.Claims;

namespace ProjectManagementAPI.Services.Implementations
{
    public class EdbService : IEdbService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EdbService(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _environment = environment;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetBaseUrl()
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            return $"{request?.Scheme}://{request?.Host}";
        }

        // ========= RÉCUPÉRER L'UTILISATEUR COURANT PAR EMAIL (token) =========
        private int? GetCurrentUserId()
        {
            var httpUser = _httpContextAccessor.HttpContext?.User;
            if (httpUser == null)
                return null;

            // adapte le nom du claim si besoin: "email", "preferred_username", etc.
            var email =
                httpUser.FindFirst(ClaimTypes.Email)?.Value ??
                httpUser.FindFirst("email")?.Value ??
                httpUser.FindFirst("preferred_username")?.Value;

            if (string.IsNullOrEmpty(email))
                return null;

            var user = _context.Users.FirstOrDefault(u => u.Email == email);
            return user?.UserId;
        }

        // ============= UPLOAD EDB =============
        public async Task<ApiResponse<EdbDTO>> UploadEdbAsync(IFormFile file, int projectId, string? description)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return new ApiResponse<EdbDTO> { Success = false, Message = "Aucun fichier fourni" };

                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    return new ApiResponse<EdbDTO> { Success = false, Message = "Projet introuvable" };

                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "EDBs");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                    await file.CopyToAsync(stream);

                var fileUrl = $"{GetBaseUrl()}/Uploads/EDBs/{uniqueFileName}";

                var edb = new EDB
                {
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    FileUrl = fileUrl,
                    UploadedAt = DateTime.UtcNow,
                    ProjectId = projectId,
                    UploadedByUserId = GetCurrentUserId()
                };

                _context.EDBs.Add(edb);
                await _context.SaveChangesAsync();

                var savedEdb = await _context.EDBs
                    .Include(e => e.Project)
                    .Include(e => e.UploadedByUser)
                    .FirstOrDefaultAsync(e => e.EdbId == edb.EdbId);

                return new ApiResponse<EdbDTO>
                {
                    Success = true,
                    Message = "Fichier EDB uploadé avec succès",
                    Data = MapToDto(savedEdb!)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<EdbDTO>
                {
                    Success = false,
                    Message = $"Erreur lors de l'upload : {ex.Message}"
                };
            }
        }

        // ============= GET ALL EDBS (Admin / Reporting) =============
        public async Task<ApiResponse<List<EdbDTO>>> GetAllEdbsAsync()
        {
            try
            {
                var edbs = await _context.EDBs
                    .Include(e => e.Project)
                    .Include(e => e.UploadedByUser)
                    .ToListAsync();

                var edbDtos = edbs.Select(MapToDto).ToList();

                return new ApiResponse<List<EdbDTO>>
                {
                    Success = true,
                    Message = $"{edbDtos.Count} EDB(s) récupéré(s)",
                    Data = edbDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<EdbDTO>>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // ============= GET PROJECT EDBS (par projectId) =============
        public async Task<ApiResponse<List<EdbDTO>>> GetProjectEdbsAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    return new ApiResponse<List<EdbDTO>> { Success = false, Message = "Projet introuvable" };

                var edbs = await _context.EDBs
                    .Where(e => e.ProjectId == projectId)
                    .Include(e => e.Project)
                    .Include(e => e.UploadedByUser)
                    .ToListAsync();

                var edbDtos = edbs.Select(MapToDto).ToList();

                return new ApiResponse<List<EdbDTO>>
                {
                    Success = true,
                    Message = $"{edbDtos.Count} EDB(s) trouvé(s) pour le projet",
                    Data = edbDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<EdbDTO>>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // ============= GET MY PROJECT EDBS (via TeamMember) =============
        public async Task<ApiResponse<List<EdbDTO>>> GetMyProjectEdbsAsync()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return new ApiResponse<List<EdbDTO>>
                    {
                        Success = false,
                        Message = "Utilisateur non authentifié"
                    };
                }

                // 1) équipes de l'utilisateur
                var myTeamIds = await _context.TeamMembers
                    .Where(tm => tm.UserId == userId && tm.IsActive)
                    .Select(tm => tm.TeamId)
                    .ToListAsync();

                if (!myTeamIds.Any())
                {
                    return new ApiResponse<List<EdbDTO>>
                    {
                        Success = true,
                        Message = "Aucune équipe assignée",
                        Data = new List<EdbDTO>()
                    };
                }

                // 2) Récupérer les projets de ces équipes
                var myProjectIds = await _context.Projects
                    .Where(p => p.TeamId.HasValue && myTeamIds.Contains(p.TeamId.Value))
                    .Select(p => p.ProjectId)
                    .ToListAsync();

                if (!myProjectIds.Any())
                {
                    return new ApiResponse<List<EdbDTO>>
                    {
                        Success = true,
                        Message = "Aucun projet pour vos équipes",
                        Data = new List<EdbDTO>()
                    };
                }

                // 3) EDB de ces projets
                var edbs = await _context.EDBs
                    .Where(e => e.ProjectId.HasValue && myProjectIds.Contains(e.ProjectId.Value))
                    .Include(e => e.Project)
                    .Include(e => e.UploadedByUser)
                    .ToListAsync();

                var edbDtos = edbs.Select(MapToDto).ToList();

                return new ApiResponse<List<EdbDTO>>
                {
                    Success = true,
                    Message = $"{edbDtos.Count} EDB(s) trouvé(s) pour vos projets",
                    Data = edbDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<EdbDTO>>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // ============= GET EDB BY ID =============
        public async Task<ApiResponse<EdbDTO>> GetEdbByIdAsync(int edbId)
        {
            try
            {
                var edb = await _context.EDBs
                    .Include(e => e.Project)
                    .Include(e => e.UploadedByUser)
                    .FirstOrDefaultAsync(e => e.EdbId == edbId);

                if (edb == null)
                    return new ApiResponse<EdbDTO> { Success = false, Message = "EDB introuvable" };

                return new ApiResponse<EdbDTO>
                {
                    Success = true,
                    Message = "EDB récupéré avec succès",
                    Data = MapToDto(edb)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<EdbDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // ============= DELETE EDB =============
        public async Task<ApiResponse<bool>> DeleteEdbAsync(int edbId)
        {
            try
            {
                var edb = await _context.EDBs.FindAsync(edbId);

                if (edb == null)
                    return new ApiResponse<bool> { Success = false, Message = "EDB introuvable" };

                if (!string.IsNullOrEmpty(edb.FilePath) && File.Exists(edb.FilePath))
                    File.Delete(edb.FilePath);

                _context.EDBs.Remove(edb);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "EDB supprimé avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // ============= MAP TO DTO =============
        private static EdbDTO MapToDto(EDB edb)
        {
            return new EdbDTO
            {
                EdbId = edb.EdbId,
                FileName = edb.FileName,
                FileUrl = edb.FileUrl,
                FileSize = edb.FileSize,
                FileType = edb.FileType,
                ProjectId = edb.ProjectId ?? 0,
                ProjectName = edb.Project?.ProjectName ?? "Non assigné",
                UploadedAt = edb.UploadedAt,
                UploadedByUserName = edb.UploadedByUser != null
                    ? $"{edb.UploadedByUser.FirstName} {edb.UploadedByUser.LastName}"
                    : null
            };
        }
    }
}
