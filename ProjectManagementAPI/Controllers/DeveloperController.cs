using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/developer")]
    [Authorize(Roles = "Developer")]
    [Produces("application/json")]
    public class DeveloperController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ApplicationDbContext _context;

        public DeveloperController(
            IProjectService projectService,
            ApplicationDbContext context)
        {
            _projectService = projectService;
            _context = context;
        }

        // ============= DEBUG TOKEN JWT =============
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
        [HttpGet("{userId}/dashboard")]
        public async Task<IActionResult> GetDashboard(int userId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .ToListAsync();

                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);

                var stats = new
                {
                    activeProjects = await _context.Projects
                        .Where(p => p.Team.TeamMembers.Any(tm => tm.UserId == userId))
                        .CountAsync(),
                    tasksInProgress = tasks.Count(t => t.TaskStatusId == 2),
                    completedTasks = tasks.Count(t => t.TaskStatusId == 5 && t.DueDate >= startOfMonth),
                    overdueTasks = tasks.Count(t => t.DueDate < now && t.TaskStatusId != 4 && t.TaskStatusId != 5),
                    totalTasks = tasks.Count,
                    pendingTasks = tasks.Count(t => t.TaskStatusId == 1)
                };

                var recentTasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project).ThenInclude(p => p.ProjectManager)
                    .Include(t => t.CreatedByUser)
                    .OrderByDescending(t => t.ProjectTaskId)
                    .Take(5)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        projectId = t.ProjectId,
                        projectName = t.Project.ProjectName,
                        projectManagerName = t.Project.ProjectManager != null
                            ? $"{t.Project.ProjectManager.FirstName} {t.Project.ProjectManager.LastName}"
                            : "Non assigné",
                        isOverdue = t.DueDate < now && t.TaskStatusId != 4 && t.TaskStatusId != 5,
                        isValidated = t.IsValidated,
                        progress = t.Progress
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "Dashboard chargé avec succès",
                    data = new { stats, tasks = recentTasks }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur dashboard", error = ex.Message });
            }
        }

        // ============= MES PROJETS =============
        [HttpGet("{userId}/projects")]
        public async Task<IActionResult> GetMyProjects(int userId)
        {
            try
            {
                var result = await _projectService.GetUserProjectsAsync(userId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur projets", error = ex.Message });
            }
        }

        // ============= DÉTAILS D'UN PROJET =============
        [HttpGet("projects/{projectId}")]
        public async Task<IActionResult> GetProjectDetails(int projectId)
        {
            try
            {
                var result = await _projectService.GetProjectByIdAsync(projectId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur projet", error = ex.Message });
            }
        }

        // ============= MES TÂCHES =============
        [HttpGet("{userId}/tasks")]
        public async Task<IActionResult> GetMyTasks(int userId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project).ThenInclude(p => p.ProjectManager)
                    .Include(t => t.CreatedByUser)
                    .OrderByDescending(t => t.ProjectTaskId)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        statusId = t.TaskStatusId,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        projectId = t.ProjectId,
                        projectName = t.Project.ProjectName,
                        projectManagerName = t.Project.ProjectManager != null
                            ? $"{t.Project.ProjectManager.FirstName} {t.Project.ProjectManager.LastName}"
                            : "Non assigné",
                        isOverdue = t.DueDate < DateTime.Now && t.TaskStatusId != 4 && t.TaskStatusId != 5,
                        isValidated = t.IsValidated,
                        progress = t.Progress
                    })
                    .ToListAsync();

                return Ok(new { success = true, message = "Tâches récupérées avec succès", data = tasks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur tâches", error = ex.Message });
            }
        }

        // ============= TÂCHES D'UN PROJET =============
        [HttpGet("{userId}/projects/{projectId}/tasks")]
        public async Task<IActionResult> GetProjectTasks(int userId, int projectId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId && t.ProjectId == projectId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .OrderByDescending(t => t.ProjectTaskId)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        progress = t.Progress
                    })
                    .ToListAsync();

                return Ok(new { success = true, message = "Tâches du projet récupérées", data = tasks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur tâches projet", error = ex.Message });
            }
        }
        // ✅ Toutes les tâches d’un projet (visibles par le développeur)
        [HttpGet("projects/{projectId}/all-tasks")]
        public async Task<IActionResult> GetAllTasksForProject(int projectId)
        {
            try
            {
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
                        projectId = t.ProjectId,
                        progress = t.Progress,
                        isValidated = t.IsValidated,
                        assignedToName = t.AssignedToUser != null
                            ? $"{t.AssignedToUser.FirstName} {t.AssignedToUser.LastName}"
                            : "Non assigné"
                    })
                    .ToListAsync();

                return Ok(new { success = true, message = "Tâches du projet récupérées", data = tasks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur tâches projet", error = ex.Message });
            }
        }

        // ============= UPDATE TÂCHE (STATUT + PROGRESSION) =============
        [HttpPut("tasks/{taskId}")]
        public async Task<IActionResult> UpdateTask(int taskId, [FromBody] UpdateTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Données invalides" });

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { success = false, message = "Utilisateur non authentifié" });

                var task = await _context.ProjectTasks.FindAsync(taskId);
                if (task == null)
                    return NotFound(new { success = false, message = "Tâche introuvable" });

                if (task.AssignedToUserId != userId)
                    return StatusCode(403, new { success = false, message = "Vous ne pouvez modifier que vos propres tâches" });

                if (task.TaskStatusId == 5)
                    return StatusCode(403, new { success = false, message = "Tâche déjà validée. Modification impossible." });

                if (task.TaskStatusId == 4 && dto.TaskStatusId != 2)
                    return StatusCode(403, new { success = false, message = "Tâche en attente de validation. Contactez votre chef de projet." });

                if (dto.Progress.HasValue)
                    task.Progress = dto.Progress.Value;

                if (task.Progress == 100 || dto.TaskStatusId == 3)
                {
                    task.TaskStatusId = 4;
                    task.Progress = 100;
                    task.IsValidated = false;
                }
                else if (dto.TaskStatusId.HasValue && dto.TaskStatusId.Value != 3)
                {
                    task.TaskStatusId = dto.TaskStatusId.Value;
                }

                await _context.SaveChangesAsync();

                // ✅ CORRECTION ICI : recalcule la progression du projet
                await RecalculateProjectProgressAsync(task.ProjectId);

                string statusName = task.TaskStatusId switch
                {
                    1 => "À faire",
                    2 => "En cours",
                    3 => "Terminé",
                    4 => "En attente de validation",
                    5 => "Validé",
                    _ => "Inconnu"
                };

                return Ok(new
                {
                    success = true,
                    message = task.TaskStatusId == 4
                        ? "Tâche terminée et envoyée au chef de projet pour validation !"
                        : $"Tâche mise à jour : {statusName}, {task.Progress}%",
                    data = new
                    {
                        taskId = task.ProjectTaskId,
                        taskStatusId = task.TaskStatusId,
                        statusName,
                        progress = task.Progress,
                        isValidated = task.IsValidated
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur mise à jour tâche", error = ex.Message });
            }
        }

        // ============= TÂCHES EN RETARD =============
        [HttpGet("{userId}/tasks/overdue")]
        public async Task<IActionResult> GetOverdueTasks(int userId)
        {
            try
            {
                var now = DateTime.Now;
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId && t.DueDate < now && t.TaskStatusId != 4 && t.TaskStatusId != 5)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project)
                    .OrderBy(t => t.DueDate)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        projectName = t.Project.ProjectName,
                        isOverdue = true
                    })
                    .ToListAsync();

                return Ok(new { success = true, message = $"{tasks.Count} tâche(s) en retard", data = tasks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erreur tâches en retard", error = ex.Message });
            }
        }

        // ✅ MÉTHODE PRIVÉE : Recalcul automatique de la progression du projet
        private async Task RecalculateProjectProgressAsync(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return;

            var tasks = await _context.ProjectTasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            if (tasks.Count == 0)
            {
                project.Progress = 0;
            }
            else
            {
                // Moyenne de la progression de toutes les tâches
                project.Progress = (int)Math.Round(tasks.Average(t => (double)t.Progress));
            }

            // Statut projet automatique
            project.ProjectStatusId = project.Progress switch
            {
                0 => 1,    // Planifié
                100 => 3,  // Terminé
                _ => 2     // En cours
            };

            await _context.SaveChangesAsync();
        }
    }
}
