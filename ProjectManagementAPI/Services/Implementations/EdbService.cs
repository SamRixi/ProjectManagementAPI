using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

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

        public async Task<ApiResponse<EdbDTO>> UploadEdbAsync(IFormFile file, string? description)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return new ApiResponse<EdbDTO>
                    {
                        Success = false,
                        Message = "Aucun fichier fourni"
                    };
                }

                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "EDBs");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"{GetBaseUrl()}/Uploads/EDBs/{uniqueFileName}";

                var edb = new EDB
                {
                    FileUrl = fileUrl,
                    ProjectId = null
                };

                _context.EDBs.Add(edb);
                await _context.SaveChangesAsync();

                return new ApiResponse<EdbDTO>
                {
                    Success = true,
                    Message = "Fichier EDB uploadé avec succès",
                    Data = MapToDto(edb)
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

        public async Task<ApiResponse<object?>> GetAllEdbsAsync()
        {
            try
            {
                var edbs = await _context.EDBs
                    .Include(e => e.Project)
                    .ToListAsync();

                var edbDtos = edbs.Select(e => MapToDto(e)).ToList();

                return new ApiResponse<object?>
                {
                    Success = true,
                    Message = $"{edbDtos.Count} EDB(s) récupéré(s)",
                    Data = edbDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<object?>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<EdbDTO>>> GetProjectEdbsAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                {
                    return new ApiResponse<List<EdbDTO>>
                    {
                        Success = false,
                        Message = "Projet introuvable"
                    };
                }

                var edbs = await _context.EDBs
                    .Where(e => e.ProjectId == projectId)
                    .Include(e => e.Project)
                    .ToListAsync();

                var edbDtos = edbs.Select(e => MapToDto(e)).ToList();

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

        public async Task<ApiResponse<EdbDTO>> GetEdbByIdAsync(int edbId)
        {
            try
            {
                var edb = await _context.EDBs
                    .Include(e => e.Project)
                    .FirstOrDefaultAsync(e => e.EdbId == edbId);

                if (edb == null)
                {
                    return new ApiResponse<EdbDTO>
                    {
                        Success = false,
                        Message = "EDB introuvable"
                    };
                }

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

        public async Task<ApiResponse<bool>> DeleteEdbAsync(int edbId)
        {
            try
            {
                var edb = await _context.EDBs.FindAsync(edbId);

                if (edb == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "EDB introuvable"
                    };
                }

                // Supprimer le fichier physique
                var fileName = Path.GetFileName(new Uri(edb.FileUrl).LocalPath);
                var filePath = Path.Combine(_environment.ContentRootPath, "Uploads", "EDBs", fileName);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

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

        private static EdbDTO MapToDto(EDB edb)
        {
            return new EdbDTO
            {
                EdbId = edb.EdbId,
                FileName = Path.GetFileName(new Uri(edb.FileUrl).LocalPath),
                FileUrl = edb.FileUrl,
                FileSize = 0, // Pas stocké dans le model
                FileType = "", // Pas stocké sdans le model
                ProjectId = edb.ProjectId,
                ProjectName = edb.Project?.ProjectName ?? "Non assigné",
                UploadedAt = DateTime.MinValue, // Pas stocké dans le model
                UploadedByUserName = null // Pas stocké dans le model
            };
        }
    }
}
