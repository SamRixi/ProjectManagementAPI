using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IProjectService
    {
        Task<ApiResponse<ProjectDTO>> CreateProjectAsync(CreateProjectDTO dto);
        Task<ApiResponse<ProjectDTO>> CreateProjectWithEdbAsync(CreateProjectWithEdbDTO dto);
        Task<ApiResponse<ProjectDTO>> UpdateProjectAsync(UpdateProjectDTO dto);
        Task<ApiResponse<bool>> DeleteProjectAsync(int projectId);
        Task<ApiResponse<ProjectDetailsDTO>> GetProjectByIdAsync(int projectId);
        Task<ApiResponse<List<ProjectDTO>>> GetAllProjectsAsync();
        Task<ApiResponse<List<ProjectDTO>>> GetTeamProjectsAsync(int teamId);
        Task<ApiResponse<List<ProjectDTO>>> GetUserProjectsAsync(int userId);
        Task<ApiResponse<ProjectStatsDTO>> GetProjectStatsAsync(int projectId);
        Task<ApiResponse<bool>> AssignTeamToProjectAsync(int projectId, int teamId);
        Task<ApiResponse<bool>> SetProjectManagerAsync(int teamMemberId, bool isProjectManager);
        Task<ApiResponse<List<TeamMemberDTO>>> GetProjectTeamMembersAsync(int projectId, string? search);
    }
}
