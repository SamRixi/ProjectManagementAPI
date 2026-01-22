using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IEdbService
    {
        Task<ApiResponse<EdbDTO>> UploadEdbAsync(IFormFile file, string? description);
        Task<ApiResponse<object?>> GetAllEdbsAsync();
        Task<ApiResponse<List<EdbDTO>>> GetProjectEdbsAsync(int projectId);
        Task<ApiResponse<EdbDTO>> GetEdbByIdAsync(int edbId);
        Task<ApiResponse<bool>> DeleteEdbAsync(int edbId);
    }
}
