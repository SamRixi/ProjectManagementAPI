using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Project Manager")]
    [Produces("application/json")]
    public class ProjectManagerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITaskService _taskService;

        public ProjectManagerController(ApplicationDbContext context, ITaskService taskService)
        {
            _context = context;
            _taskService = taskService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // ============= HELPER : Calcul statut dynamique =============
        private static (string statusName, string statusColor) GetDynamicStatus(
            int? projectStatusId,
            int pendingValidationTasks,
            int progress,
            int validatedTasks,
            int totalTasks,
            bool isDelayed,
            int notFinishedTasks,
            string? dbStatusName,
            string? dbStatusColor)
        {
            if (projectStatusId == 4)
                return ("Annulé", "#9E9E9E");

            if (projectStatusId == 3 && totalTasks > 0 && validatedTasks == totalTasks)
                return ("Terminé", "#00C853");

            if (totalTasks > 0 && validatedTasks == totalTasks && pendingValidationTasks == 0)
                return ("✅ Prêt à finaliser", "#00BFA5");

            if (notFinishedTasks == 0 && pendingValidationTasks > 0)
                return ("⏳ En attente de validation", "#FFA500");

            if (isDelayed)
                return ("🔴 En retard", "#FF0000");

            return (dbStatusName ?? "En cours", dbStatusColor ?? "#2196F3");
        }

        // ============= DEBUG TOKEN =============
        [HttpGet("debug/token")]
        public IActionResult DebugToken()
        {
            var claims = User.Claims.Select(c => new { type = c.Type, value = c.Value }).ToList();
            return Ok(new
            {
                success = true,
                message = "Claims du token JWT",
                claims,
                userIsAuthenticated = User.Identity?.IsAuthenticated ?? false,
                userName = User.Identity?.Name ?? "N/A"
            });
        }

        // ============= DASHBOARD =============
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var userId = GetCurrentUserId();

                var projects = await _context.Projects
                    .Where(p => p.ProjectManagerId == userId)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Team)
                        .ThenInclude(t => t.TeamMembers)
                    .ToListAsync();

                var totalProjects = projects.Count;
                var totalTasks = projects.Sum(p => p.ProjectTasks?.Count ?? 0);
                var completedTasks = projects.Sum(p => p.ProjectTasks?.Count(t => t.Progress == 100) ?? 0);
                var pendingTasks = totalTasks - completedTasks;
                var tasksAwaitingValidation = projects.Sum(p => p.ProjectTasks?.Count(t => t.TaskStatusId == 4) ?? 0);

                var activeMembers = projects
                    .SelectMany(p => p.Team?.TeamMembers ?? new List<TeamMember>())
                    .Select(tm => tm.UserId)
                    .Distinct()
                    .Count();

                var projectsList = projects.Select(p =>
                {
                    var tasks = p.ProjectTasks ?? new List<ProjectTask>();
                    var totalTasksCount = tasks.Count;
                    var completed = tasks.Count(t => t.Progress == 100);
                    var inProgress = tasks.Count(t => t.Progress > 0 && t.Progress < 100);
                    var todo = tasks.Count(t => t.Progress == 0);
                    var pendingValidation = tasks.Count(t => t.TaskStatusId == 4);
                    var validated = tasks.Count(t => t.IsValidated);
                    var notFinished = tasks.Count(t => t.Progress < 100);

                    int progress = totalTasksCount > 0
                        ? (int)Math.Round((completed * 100.0) / totalTasksCount)
                        : 0;

                    bool isDelayed = p.EndDate.HasValue
                        && p.EndDate.Value < DateTime.UtcNow
                        && (totalTasksCount == 0 || progress < 100);

                    var (statusName, statusColor) = GetDynamicStatus(
                        p.ProjectStatusId, pendingValidation, progress,
                        validated, totalTasksCount, isDelayed,
                        notFinished,
                        p.ProjectStatus?.StatusName, p.ProjectStatus?.Color);

                    return new
                    {
                        projectId = p.ProjectId,
                        projectName = p.ProjectName,
                        statusName,
                        statusColor,
                        totalTasks = totalTasksCount,
                        completedTasks = completed,
                        inProgressTasks = inProgress,
                        todoTasks = todo,
                        pendingValidationTasks = pendingValidation,
                        progress,
                        isDelayed
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    message = "Dashboard chargé avec succès",
                    data = new
                    {
                        stats = new
                        {
                            totalProjects,
                            totalTasks,
                            completedTasks,
                            pendingTasks,
                            tasksAwaitingValidation,
                            activeMembers
                        },
                        projects = projectsList
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur dashboard", error = ex.Message });
            }
        }

        // ============= MES PROJETS =============
        [HttpGet("my-projects")]
        public async Task<IActionResult> GetMyProjects()
        {
            try
            {
                var userId = GetCurrentUserId();

                var projects = await _context.Projects
                    .Where(p => p.ProjectManagerId == userId)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Team)
                    .ToListAsync();

                var projectsList = projects.Select(p =>
                {
                    var tasks = p.ProjectTasks ?? new List<ProjectTask>();
                    var totalTasks = tasks.Count;
                    var completedTasks = tasks.Count(t => t.Progress == 100);
                    var validatedTasks = tasks.Count(t => t.IsValidated);
                    var inProgressTasks = tasks.Count(t => t.Progress > 0 && t.Progress < 100);
                    var todoTasks = tasks.Count(t => t.Progress == 0);
                    var pendingValidationTasks = tasks.Count(t => t.TaskStatusId == 4);
                    var notFinishedTasks = tasks.Count(t => t.Progress < 100);

                    int progress = totalTasks > 0
                        ? (int)Math.Round((completedTasks * 100.0) / totalTasks)
                        : 0;

                    bool isDelayed = p.EndDate.HasValue
                        && p.EndDate.Value < DateTime.UtcNow
                        && (totalTasks == 0 || progress < 100);

                    var (statusName, statusColor) = GetDynamicStatus(
                        p.ProjectStatusId, pendingValidationTasks, progress,
                        validatedTasks, totalTasks, isDelayed,
                        notFinishedTasks,
                        p.ProjectStatus?.StatusName, p.ProjectStatus?.Color);

                    return new
                    {
                        projectId = p.ProjectId,
                        projectName = p.ProjectName,
                        description = p.Description ?? "",
                        statusName,
                        statusColor,
                        teamName = p.Team?.teamName ?? "Aucune équipe",
                        totalTasks,
                        completedTasks,
                        inProgressTasks,
                        validatedTasks,
                        todoTasks,
                        pendingValidationTasks,
                        progress,
                        isDelayed,
                        startDate = p.StartDate,
                        endDate = p.EndDate
                    };
                }).ToList();

                return Ok(new { success = true, message = "Projets récupérés avec succès", data = projectsList });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur récupération projets", error = ex.Message });
            }
        }

        // ============= STATS D'UN PROJET =============
        [HttpGet("projects/{projectId}/stats")]
        public async Task<IActionResult> GetProjectStats(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var project = await _context.Projects
                    .Where(p => p.ProjectId == projectId)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Team)
                    .FirstOrDefaultAsync();

                if (project == null)
                    return NotFound(new { success = false, message = "Projet non trouvé" });

                if (project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                var tasks = project.ProjectTasks ?? new List<ProjectTask>();
                var totalTasks = tasks.Count;
                var completedTasks = tasks.Count(t => t.Progress == 100);
                var validatedTasks = tasks.Count(t => t.IsValidated);
                var inProgressTasks = tasks.Count(t => t.Progress > 0 && t.Progress < 100);
                var todoTasks = tasks.Count(t => t.Progress == 0);
                var pendingValidationTasks = tasks.Count(t => t.TaskStatusId == 4);
                var notFinishedTasks = tasks.Count(t => t.Progress < 100);

                int progress = totalTasks > 0
                    ? (int)Math.Round((completedTasks * 100.0) / totalTasks)
                    : 0;

                bool isDelayed = project.EndDate.HasValue
                    && project.EndDate.Value < DateTime.UtcNow
                    && (totalTasks == 0 || progress < 100);

                var (statusName, statusColor) = GetDynamicStatus(
                    project.ProjectStatusId, pendingValidationTasks, progress,
                    validatedTasks, totalTasks, isDelayed,
                    notFinishedTasks,
                    project.ProjectStatus?.StatusName, project.ProjectStatus?.Color);

                return Ok(new
                {
                    success = true,
                    message = "Statistiques récupérées avec succès",
                    data = new
                    {
                        projectId = project.ProjectId,
                        projectName = project.ProjectName,
                        description = project.Description ?? "",
                        statusName,
                        statusColor,
                        teamName = project.Team?.teamName ?? "Aucune équipe",
                        totalTasks,
                        completedTasks,
                        inProgressTasks,
                        validatedTasks,
                        todoTasks,
                        pendingValidationTasks,
                        progress,
                        isDelayed,
                        startDate = project.StartDate,
                        endDate = project.EndDate
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur stats", error = ex.Message });
            }
        }

        // ============= TÂCHES D'UN PROJET =============
        [HttpGet("projects/{projectId}/tasks")]
        public async Task<IActionResult> GetProjectTasks(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return NotFound(new { success = false, message = "Projet non trouvé" });

                if (project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                if (project.ProjectStatusId == 4)
                    return Ok(new { success = true, message = "Projet annulé", data = new List<object>() });

                var tasks = await _context.ProjectTasks
                    .Where(t => t.ProjectId == projectId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .OrderByDescending(t => t.ProjectTaskId)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        assignedToName = t.AssignedToUser != null
                            ? t.AssignedToUser.FirstName + " " + t.AssignedToUser.LastName
                            : "Non assigné",
                        progress = t.Progress,
                        isValidated = t.IsValidated,
                        isOverdue = t.DueDate < DateTime.Now && t.TaskStatusId != 4 && t.TaskStatusId != 5,
                        rejectionReason = t.RejectionReason,
                        rejectedAt = t.RejectedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, message = "Tâches récupérées avec succès", data = tasks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur récupération tâches", error = ex.Message });
            }
        }

        // ============= CRÉER UNE TÂCHE =============
        [HttpPost("tasks")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Données invalides" });

                var userId = GetCurrentUserId();
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId);

                if (project == null)
                    return NotFound(new { success = false, message = "Projet non trouvé" });

                if (project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                var result = await _taskService.CreateTaskAsync(dto, userId);

                if (!result.Success)
                    return BadRequest(new { success = false, message = result.Message });

                return Ok(new { success = true, message = result.Message, data = result.Data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur création tâche", error = ex.Message });
            }
        }

        // ============= SUPPRIMER UNE TÂCHE =============
        [HttpDelete("tasks/{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return NotFound(new { success = false, message = "Tâche non trouvée" });

                if (task.Project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                if (task.IsValidated)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"❌ Impossible de supprimer : la tâche '{task.TaskName}' est déjà validée."
                    });

                if (task.Progress > 0)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"❌ Impossible de supprimer : la tâche '{task.TaskName}' est en cours ({task.Progress}% complétée)."
                    });

                if (task.TaskStatusId == 4)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"❌ Impossible de supprimer : la tâche '{task.TaskName}' est en attente de validation."
                    });

                var notifications = await _context.Notifications
                    .Where(n => n.RelatedTaskId == taskId)
                    .ToListAsync();
                _context.Notifications.RemoveRange(notifications);

                _context.ProjectTasks.Remove(task);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"✅ Tâche '{task.TaskName}' supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur suppression tâche", error = ex.Message });
            }
        }

        // ============= ASSIGNER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/assign")]
        public async Task<IActionResult> AssignTask(int taskId, [FromBody] AssignTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Données invalides" });

                var userId = GetCurrentUserId();
                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return NotFound(new { success = false, message = "Tâche non trouvée" });

                if (task.Project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == dto.AssignedToUserId);

                if (user == null)
                    return BadRequest(new { success = false, message = "Utilisateur non trouvé" });

                if (user.Role.RoleName != "Developer")
                    return BadRequest(new { success = false, message = "❌ Seuls les développeurs peuvent être assignés à une tâche." });

                task.AssignedToUserId = dto.AssignedToUserId;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Tâche assignée à {user.FirstName} {user.LastName}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur assignation", error = ex.Message });
            }
        }

        // ============= MEMBRES D'ÉQUIPE (Developers uniquement) =============
        [HttpGet("projects/{projectId}/team-members")]
        public async Task<IActionResult> GetProjectTeamMembers(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _context.Projects
                    .Include(p => p.Team)
                        .ThenInclude(t => t.TeamMembers)
                            .ThenInclude(tm => tm.User)
                                .ThenInclude(u => u.Role)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return NotFound(new { success = false, message = "Projet non trouvé" });

                if (project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                var members = project.Team?.TeamMembers
                    .Where(tm => tm.User.Role.RoleName == "Developer")
                    .Select(tm => new
                    {
                        userId = tm.UserId,
                        fullName = tm.User.FirstName + " " + tm.User.LastName,
                        email = tm.User.Email,
                        roleName = tm.User.Role.RoleName,
                        isProjectManager = tm.IsProjectManager
                    }).ToList();

                return Ok(new
                {
                    success = true,
                    message = members?.Any() == true ? "Membres récupérés" : "Aucun développeur trouvé",
                    data = members ?? new List<object>() as object
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur membres", error = ex.Message });
            }
        }

        // ============= TÂCHES EN ATTENTE DE VALIDATION =============
        [HttpGet("tasks/awaiting-validation")]
        public async Task<IActionResult> GetTasksAwaitingValidation()
        {
            try
            {
                var userId = GetCurrentUserId();

                var tasks = await _context.ProjectTasks
                    .Where(t =>
                        t.Project.ProjectManagerId == userId &&
                        t.TaskStatusId == 4 &&
                        t.Project.ProjectStatusId != 3 &&
                        t.Project.ProjectStatusId != 4)
                    .Include(t => t.Project)
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .OrderBy(t => t.DueDate)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        projectName = t.Project.ProjectName,
                        assignedToName = t.AssignedToUser != null
                            ? t.AssignedToUser.FirstName + " " + t.AssignedToUser.LastName
                            : "Non assigné",
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        progress = t.Progress,
                        rejectionReason = t.RejectionReason,
                        rejectedAt = t.RejectedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = $"{tasks.Count} tâche(s) en attente de validation",
                    data = tasks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur validation", error = ex.Message });
            }
        }

        [HttpGet("validation")]
        public async Task<IActionResult> GetValidationTasks() => await GetTasksAwaitingValidation();

        // ============= VALIDER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/validate")]
        public async Task<IActionResult> ValidateTask(int taskId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                        .ThenInclude(p => p.ProjectTasks)
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return NotFound(new { success = false, message = "Tâche non trouvée" });

                if (task.Project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                task.TaskStatusId = 5;
                task.Progress = 100;
                task.IsValidated = true;
                task.ValidatedByUserId = userId;
                task.ValidatedAt = DateTime.UtcNow;

                // reset éventuelle info de rejet
                task.RejectionReason = null;
                task.RejectedAt = null;

                if (task.AssignedToUserId.HasValue)
                {
                    var devId = task.AssignedToUserId.Value;
                    var pm = await _context.Users.FindAsync(userId);

                    _context.Notifications.Add(new Notification
                    {
                        UserId = devId,
                        Title = "✅ Tâche validée",
                        Message =
                            $"Votre tâche '{task.TaskName}' a été validée par " +
                            $"{pm?.FirstName} {pm?.LastName}.",
                        Type = "TASK_VALIDATED",
                        RelatedTaskId = task.ProjectTaskId,
                        RelatedProjectId = task.ProjectId,
                        RelatedUserId = userId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                var allTasks = task.Project.ProjectTasks ?? new List<ProjectTask>();
                var allValidated = allTasks.All(t => t.IsValidated);

                return Ok(new
                {
                    success = true,
                    message = $"Tâche '{task.TaskName}' validée avec succès",
                    data = new
                    {
                        taskId = task.ProjectTaskId,
                        validatedAt = task.ValidatedAt,
                        canCloseProject = allValidated,
                        projectId = task.ProjectId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur validation tâche", error = ex.Message });
            }
        }

        // ============= FINALISER UN PROJET =============
        [HttpPut("projects/{projectId}/close")]
        public async Task<IActionResult> CloseProject(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return NotFound(new { success = false, message = "Projet non trouvé" });

                if (project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                var tasks = project.ProjectTasks ?? new List<ProjectTask>();
                var totalTasks = tasks.Count;
                var validatedTasks = tasks.Count(t => t.IsValidated);
                var pendingTasks = tasks.Count(t => t.TaskStatusId == 4);

                if (pendingTasks > 0)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"❌ Impossible de finaliser : {pendingTasks} tâche(s) encore en attente de validation."
                    });

                if (totalTasks > 0 && validatedTasks < totalTasks)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"❌ Impossible de finaliser : {validatedTasks}/{totalTasks} tâche(s) validées seulement."
                    });

                project.Progress = 100;
                project.ProjectStatusId = 3;
                await _context.SaveChangesAsync();

                var reportingUsers = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Role.RoleName == "Reporting")
                    .ToListAsync();

                foreach (var reportingUser in reportingUsers)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = reportingUser.UserId,
                        Title = "🏁 Projet terminé",
                        Message = $"Le projet '{project.ProjectName}' a été finalisé par le chef de projet.",
                        Type = "PROJECT_FINISHED",
                        RelatedProjectId = project.ProjectId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "✅ Projet finalisé avec succès",
                    data = new { projectId = project.ProjectId, statusId = project.ProjectStatusId }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur finalisation projet", error = ex.Message });
            }
        }

        // ============= REFUSER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/reject")]
        public async Task<IActionResult> RejectTask(int taskId, [FromBody] RejectTaskDTO dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return NotFound(new { success = false, message = "Tâche non trouvée" });

                if (task.Project.ProjectManagerId != userId)
                    return StatusCode(403, new { success = false, message = "Non autorisé" });

                // Remettre la tâche "À faire"
                task.TaskStatusId = 1;
                task.IsValidated = false;
                task.Progress = 0;

                if (!string.IsNullOrWhiteSpace(dto.Reason))
                {
                    task.RejectionReason = dto.Reason;
                    task.RejectedAt = DateTime.UtcNow;
                }
                else
                {
                    task.RejectionReason = "Aucune raison fournie";
                    task.RejectedAt = DateTime.UtcNow;
                }

                if (task.AssignedToUserId.HasValue)
                {
                    var devId = task.AssignedToUserId.Value;
                    var pm = await _context.Users.FindAsync(userId);

                    _context.Notifications.Add(new Notification
                    {
                        UserId = devId,
                        Title = "❌ Tâche refusée",
                        Message =
                            $"Votre tâche '{task.TaskName}' a été refusée par " +
                            $"{pm?.FirstName} {pm?.LastName}. " +
                            (!string.IsNullOrWhiteSpace(dto.Reason)
                                ? $"Raison : {dto.Reason}"
                                : "Merci de corriger et de la soumettre à nouveau."),
                        Type = "TASK_REJECTED",
                        RelatedTaskId = task.ProjectTaskId,
                        RelatedProjectId = task.ProjectId,
                        RelatedUserId = userId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Tâche '{task.TaskName}' refusée et remise à faire" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur refus tâche", error = ex.Message });
            }
        }
    }
}
