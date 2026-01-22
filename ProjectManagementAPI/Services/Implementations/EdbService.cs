using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Data;

public class EdbService : IEdbService
{
    private readonly ApplicationDbContext _context;
    private readonly string _uploadPath = "uploads/edbs"; // Chemin de stockage

    public EdbService(ApplicationDbContext context)
    {
        _context = context;

        // Créer le dossier s'il n'existe pas
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
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
                    Message = "Fichier invalide"
                };
            }

            // Générer un nom de fichier unique
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(_uploadPath, fileName);

            // Sauvegarder le fichier
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Créer l'entrée EDB dans la BD (sans ProjectId pour l'instant)
            var edb = new EDB
            {
                FileName = file.FileName,
                FileUrl = filePath,
                FileSize = file.Length,
                FileType = Path.GetExtension(file.FileName),
                UploadedAt = DateTime.UtcNow,
                ProjectId = 0 // Sera lié au projet plus tard
            };

            _context.EDBs.Add(edb);
            await _context.SaveChangesAsync();

            return new ApiResponse<EdbDTO>
            {
                Success = true,
                Message = "Fichier EDB uploadé avec succès",
                Data = new EdbDTO
                {
                    EdbId = edb.EdbId,
                    FileName = edb.FileName,
                    FileUrl = edb.FileUrl,
                    FileSize = edb.FileSize,
                    FileType = edb.FileType,
                    UploadedAt = edb.UploadedAt
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<EdbDTO>
            {
                Success = false,
                Message = $"Erreur lors de l'upload: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<EdbDTO>>> GetAllEdbsAsync()
    {
        try
        {
            var edbs = await _context.EDBs
                .Include(e => e.Project)
                .Select(e => new EdbDTO
                {
                    EdbId = e.EdbId,
                    FileName = e.FileName,
                    FileUrl = e.FileUrl,
                    FileSize = e.FileSize,
                    FileType = e.FileType,
                    ProjectId = e.ProjectId,
                    ProjectName = e.Project.ProjectName,
                    UploadedAt = e.UploadedAt
                })
                .ToListAsync();

            return new ApiResponse<List<EdbDTO>>
            {
                Success = true,
                Message = "EDBs récupérés avec succès",
                Data = edbs
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<EdbDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
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
                Data = new EdbDTO
                {
                    EdbId = edb.EdbId,
                    FileName = edb.FileName,
                    FileUrl = edb.FileUrl,
                    FileSize = edb.FileSize,
                    FileType = edb.FileType,
                    ProjectId = edb.ProjectId,
                    ProjectName = edb.Project?.ProjectName,
                    UploadedAt = edb.UploadedAt
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<EdbDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<EdbDTO>>> GetProjectEdbsAsync(int projectId)
    {
        try
        {
            var edbs = await _context.EDBs
                .Where(e => e.ProjectId == projectId)
                .Include(e => e.Project)
                .Select(e => new EdbDTO
                {
                    EdbId = e.EdbId,
                    FileName = e.FileName,
                    FileUrl = e.FileUrl,
                    FileSize = e.FileSize,
                    FileType = e.FileType,
                    ProjectId = e.ProjectId,
                    ProjectName = e.Project.ProjectName,
                    UploadedAt = e.UploadedAt
                })
                .ToListAsync();

            return new ApiResponse<List<EdbDTO>>
            {
                Success = true,
                Message = "EDBs du projet récupérés",
                Data = edbs
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<EdbDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
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
            if (File.Exists(edb.FileUrl))
            {
                File.Delete(edb.FileUrl);
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
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public Task<ApiResponse<EdbDTO>> UploadEdbAsync(CreateEdbDTO dto, int uploadedByUserId)
    {
        throw new NotImplementedException();
    }

    Task<ApiResponse<object?>> IEdbService.GetAllEdbsAsync()
    {
        throw new NotImplementedException();
    }
}


