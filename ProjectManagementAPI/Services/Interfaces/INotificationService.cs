using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface INotificationService
    {
        Task<ApiResponse<List<NotificationDTO>>> GetUserNotificationsAsync(int userId);
        Task<ApiResponse<int>> GetUnreadCountAsync(int userId);
        Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId);
        Task<ApiResponse<bool>> MarkAllAsReadAsync(int userId);
        Task<ApiResponse<bool>> DeleteNotificationAsync(int notificationId);
        Task<ApiResponse<bool>> CreateNotificationAsync(int userId, string title, string message, string? type = "Info", int? relatedProjectId = null, int? relatedTaskId = null);
    }
}
