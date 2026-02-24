using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.Security.Claims;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Reporting")]
    [Produces("application/json")]
    public class ReportingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportingController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // ============= LISTE DES NOTIFICATIONS =============
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            try
            {
                var userId = GetCurrentUserId();

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        notificationId = n.NotificationId,
                        title = n.Title,
                        message = n.Message,
                        type = n.Type,
                        isRead = n.IsRead,
                        createdAt = n.CreatedAt,
                        readAt = n.ReadAt,
                        relatedProjectId = n.RelatedProjectId,
                        relatedTaskId = n.RelatedTaskId,
                        relatedUserId = n.RelatedUserId
                    })
                    .ToListAsync();

                var unreadCount = notifications.Count(n => !n.isRead);

                return Ok(new
                {
                    success = true,
                    message = "Notifications récupérées avec succès",
                    data = notifications,
                    unreadCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur récupération notifications", error = ex.Message });
            }
        }

        // ============= MARQUER UNE NOTIF COMME LUE =============
        [HttpPut("notifications/{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var notif = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);

                if (notif == null)
                    return NotFound(new { success = false, message = "Notification non trouvée" });

                if (!notif.IsRead)
                {
                    notif.IsRead = true;
                    notif.ReadAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "Notification marquée comme lue" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur mise à jour notification", error = ex.Message });
            }
        }

        // ============= TOUTES COMME LUES =============
        [HttpPut("notifications/read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = GetCurrentUserId();

                var notifs = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var n in notifs)
                {
                    n.IsRead = true;
                    n.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Toutes les notifications ont été marquées comme lues" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur mise à jour notifications", error = ex.Message });
            }
        }
    }
}
