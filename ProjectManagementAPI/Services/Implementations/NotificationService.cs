using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;

        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<bool>> CreateNotificationAsync(
            int userId, string title, string message, string? type = "Info",
            int? relatedProjectId = null, int? relatedTaskId = null)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Utilisateur introuvable"
                    };
                }

                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    IsRead = false,
                    RelatedProjectId = relatedProjectId,
                    RelatedTaskId = relatedTaskId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Notification créée avec succès",
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

        public async Task<ApiResponse<List<NotificationDTO>>> GetUserNotificationsAsync(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NotificationDTO
                    {
                        NotificationId = n.NotificationId,
                        Title = n.Title,
                        Message = n.Message,
                        Type = n.Type,
                        IsRead = n.IsRead,
                        RelatedProjectId = n.RelatedProjectId,
                        RelatedTaskId = n.RelatedTaskId,
                        CreatedAt = n.CreatedAt,
                        ReadAt = n.ReadAt
                    })
                    .ToListAsync();

                return new ApiResponse<List<NotificationDTO>>
                {
                    Success = true,
                    Message = $"{notifications.Count} notification(s) trouvée(s)",
                    Data = notifications
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<NotificationDTO>>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<int>> GetUnreadCountAsync(int userId)
        {
            try
            {
                var count = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = $"{count} notification(s) non lue(s)",
                    Data = count
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);

                if (notification == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Notification introuvable"
                    };
                }

                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Notification marquée comme lue",
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

        public async Task<ApiResponse<bool>> MarkAllAsReadAsync(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"{notifications.Count} notification(s) marquée(s) comme lue(s)",
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

        public async Task<ApiResponse<bool>> DeleteNotificationAsync(int notificationId)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);

                if (notification == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Notification introuvable"
                    };
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Notification supprimée",
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
    }
}
