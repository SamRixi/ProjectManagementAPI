using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IStatisticsService
    {
        Task<ApiResponse<GlobalStatsDTO>> GetGlobalStatsAsync();
        Task<ApiResponse<ProjectStatsDTO>> GetProjectStatsAsync(int projectId);
    }
}
