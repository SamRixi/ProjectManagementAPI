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

        // ============= DEBUG TOKEN JWT (TEMPORAIRE) =============
        [HttpGet("debug/token")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult DebugToken()
        {
            var claims = User.Claims.Select(c => new
            {
                type = c.Type,
                value = c.Value
            }).ToList();

            return Ok(new
            {
                success = true,
                message = "Claims du token JWT",
                claims = claims,
                userIsAuthenticated = User.Identity?.IsAuthenticated ?? false,
                userName = User.Identity?.Name ?? "N/A"
            });
        }

        // ============= DASHBOARD =============
        [HttpGet("{userId}/dashboard")]
        [ProducesResponseType(StatusCodes.Status200OK)]
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
                    completedTasks = tasks.Count(t => t.TaskStatusId == 5 && t.DueDate >= startOfMonth), // ✅ Validé
                    overdueTasks = tasks.Count(t => t.DueDate < now && t.TaskStatusId != 4 && t.TaskStatusId != 5), // ✅ Exclure en attente et validé
                    totalTasks = tasks.Count,
                    pendingTasks = tasks.Count(t => t.TaskStatusId == 1)
                };

                var recentTasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project)
                        .ThenInclude(p => p.ProjectManager)
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
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors du chargement du dashboard",
                    error = ex.Message
                });
            }
        }

        // ============= MES PROJETS =============
        [HttpGet("{userId}/projects")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProjects(int userId)
        {
            try
            {
                var result = await _projectService.GetUserProjectsAsync(userId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets",
                    error = ex.Message
                });
            }
        }

        // ============= DÉTAILS D'UN PROJET =============
        [HttpGet("projects/{projectId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProjectDetails(int projectId)
        {
            try
            {
                var result = await _projectService.GetProjectByIdAsync(projectId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération du projet",
                    error = ex.Message
                });
            }
        }

        // ============= MES TÂCHES =============
        [HttpGet("{userId}/tasks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyTasks(int userId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project)
                        .ThenInclude(p => p.ProjectManager)
                    .Include(t => t.CreatedByUser)
                    .OrderByDescending(t => t.ProjectTaskId)
                    .Select(t => new
                    {
                        taskId = t.ProjectTaskId,
                        taskName = t.TaskName,
                        description = t.Description,
                        status = t.ProjectTasksStatus.StatusName,
                        priority = t.Priority.Name,
                        deadline = t.DueDate,
                        projectName = t.Project.ProjectName,
                        projectManagerName = t.Project.ProjectManager != null
                            ? $"{t.Project.ProjectManager.FirstName} {t.Project.ProjectManager.LastName}"
                            : "Non assigné",
                        isOverdue = t.DueDate < DateTime.Now && t.TaskStatusId != 4 && t.TaskStatusId != 5,
                        progress = t.Progress
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "Tâches récupérées avec succès",
                    data = tasks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des tâches",
                    error = ex.Message
                });
            }
        }

        // ============= TÂCHES D'UN PROJET =============
        [HttpGet("{userId}/projects/{projectId}/tasks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
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

                return Ok(new
                {
                    success = true,
                    message = "Tâches du projet récupérées avec succès",
                    data = tasks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des tâches",
                    error = ex.Message
                });
            }
        }

        // ============= UPDATE TÂCHE (STATUT + PROGRESSION) =============
        [HttpPut("tasks/{taskId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateTask(int taskId, [FromBody] UpdateTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Données invalides",
                        errors = ModelState.Values
                            .SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Utilisateur non authentifié" });
                }

                var task = await _context.ProjectTasks.FindAsync(taskId);

                if (task == null)
                    return NotFound(new { success = false, message = "Tâche introuvable" });

                if (task.AssignedToUserId != userId)
                    return StatusCode(403, new { success = false, message = "Vous ne pouvez modifier que vos propres tâches" });

                // ✅ RÈGLE MÉTIER: Si statut = Terminé (3) → passer en En attente de validation (4)
                if (dto.TaskStatusId.HasValue)
                {
                    if (dto.TaskStatusId.Value == 3)
                    {
                        task.TaskStatusId = 4; // En attente de validation
                        task.Progress = 100;
                        task.IsValidated = false;
                    }
                    else
                    {
                        task.TaskStatusId = dto.TaskStatusId.Value;
                    }
                }

                // ✅ Mise à jour progression (sauf si en attente de validation ou validé)
                if (dto.Progress.HasValue && task.TaskStatusId != 4 && task.TaskStatusId != 5)
                {
                    task.Progress = dto.Progress.Value;
                }

                await _context.SaveChangesAsync();

                string statusName = task.TaskStatusId switch
                {
                    1 => "À faire",
                    2 => "En cours",
                    4 => "En attente de validation",
                    5 => "Validé",
                    _ => "Inconnu"
                };

                return Ok(new
                {
                    success = true,
                    message = $"Tâche mise à jour avec succès. Statut : {statusName}, Progression : {task.Progress}%"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la mise à jour de la tâche",
                    error = ex.Message
                });
            }
        }

        // ============= TÂCHES EN RETARD =============
        [HttpGet("{userId}/tasks/overdue")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverdueTasks(int userId)
        {
            try
            {
                var now = DateTime.Now;

                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId
                             && t.DueDate < now
                             && t.TaskStatusId != 4
                             && t.TaskStatusId != 5)
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

                return Ok(new
                {
                    success = true,
                    message = $"{tasks.Count} tâche(s) en retard",
                    data = tasks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des tâches en retard",
                    error = ex.Message
                });
            }
        }
    }
}
