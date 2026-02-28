using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IEdbService
    {
        Task<ApiResponse<EdbDTO>> UploadEdbAsync(IFormFile file, int projectId, string? description);
        Task<ApiResponse<List<EdbDTO>>> GetAllEdbsAsync();
        Task<ApiResponse<List<EdbDTO>>> GetProjectEdbsAsync(int projectId);
        Task<ApiResponse<List<EdbDTO>>> GetMyProjectEdbsAsync();   // ✅ ajouter
        Task<ApiResponse<EdbDTO>> GetEdbByIdAsync(int edbId);
        Task<ApiResponse<bool>> DeleteEdbAsync(int edbId);
    }
}
