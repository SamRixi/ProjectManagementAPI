using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface ITeamService
    {
        Task<ApiResponse<TeamDTO>> CreateTeamAsync(CreateTeamDTO dto);
        Task<ApiResponse<TeamDTO>> UpdateTeamAsync(UpdateTeamDTO dto);
        Task<ApiResponse<bool>> DeleteTeamAsync(int teamId);
        Task<ApiResponse<TeamDetailsDTO>> GetTeamByIdAsync(int teamId);
        Task<ApiResponse<List<TeamDTO>>> GetAllTeamsAsync();
        Task<ApiResponse<TeamMemberDTO>> AddMemberAsync(AddTeamMemberDTO dto);
        Task<ApiResponse<bool>> RemoveMemberAsync(int teamMemberId);
        Task<ApiResponse<bool>> ToggleTeamActiveAsync(int teamId, bool isActive);
        Task<ApiResponse<bool>> ToggleMemberActiveAsync(int memberId, bool isActive);
        Task<ApiResponse<List<TeamMemberDTO>>> GetTeamMembersAsync(int teamId);
        Task<ApiResponse<bool>> RemoveMemberAsync(int teamId, int userId);
        Task<ApiResponse<List<ProjectManagerDTO>>> GetProjectManagersAsync();
        Task<ApiResponse<bool>> SetProjectManagerAsync(int teamMemberId, bool isProjectManager);

    }
}
