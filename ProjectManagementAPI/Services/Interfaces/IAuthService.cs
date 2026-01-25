using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
        Task<ApiResponse<UserDTO>> RegisterAsync(RegisterRequest request);
        Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordDTO dto);
        Task<ApiResponse<object>> ForgotPasswordAsync(ForgotPasswordRequest dto);
        Task<ApiResponse<object>> ResetPasswordAsync(ResetPasswordRequest dto);
    }
}
