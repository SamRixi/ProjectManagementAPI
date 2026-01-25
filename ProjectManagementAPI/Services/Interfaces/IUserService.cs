using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IUserService
    {
        // CRUD
        Task<ApiResponse<UserDTO>> CreateUserAsync(CreateUserDTO dto);
        Task<ApiResponse<UserDTO>> UpdateUserAsync(UpdateUserDTO dto);
        Task<ApiResponse<UserDTO>> GetUserByIdAsync(int userId);
        Task<ApiResponse<List<UserDTO>>> GetAllUsersAsync();
        Task<ApiResponse<List<UserDTO>>> SearchUsersAsync(SearchUsersDTO dto);

        // Account Management
        Task<ApiResponse<bool>> ToggleUserActiveAsync(int userId, bool isActive);
        Task<ApiResponse<bool>> SetAccountDeadlineAsync(int userId, DateTime? deadline);

        // Password Management
        Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDTO dto);
        Task<ApiResponse<bool>> ForgotPasswordAsync(string email);
        Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest dto);
        Task<ApiResponse<string>> GenerateTemporaryPasswordAsync(int userId);

        // Login helpers
        Task<ApiResponse<bool>> CheckAccountValidityAsync(int userId);
        Task UpdateLastLoginAsync(int userId);
    }
}
