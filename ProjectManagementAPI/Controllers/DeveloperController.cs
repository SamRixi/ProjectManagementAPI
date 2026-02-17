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
                Console.WriteLine("========================================");
                Console.WriteLine($"🔍 UPDATE TASK APPELÉ - TaskId: {taskId}");
                Console.WriteLine($"📥 DTO reçu - TaskStatusId: {dto.TaskStatusId}, Progress: {dto.Progress}");
                Console.WriteLine("========================================");

                if (!ModelState.IsValid)
                {
                    Console.WriteLine("❌ ModelState INVALIDE");
                    var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList();
                    foreach (var error in errors)
                    {
                        Console.WriteLine($"   - {error}");
                    }
                    return BadRequest(new
                    {
                        success = false,
                        message = "Données invalides",
                        errors = errors
                    });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    Console.WriteLine("❌ Utilisateur NON authentifié");
                    return Unauthorized(new { success = false, message = "Utilisateur non authentifié" });
                }

                Console.WriteLine($"✅ UserId authentifié: {userId}");

                var task = await _context.ProjectTasks.FindAsync(taskId);

                if (task == null)
                {
                    Console.WriteLine($"❌ Tâche {taskId} introuvable");
                    return NotFound(new { success = false, message = "Tâche introuvable" });
                }

                Console.WriteLine($"✅ Tâche trouvée: '{task.TaskName}'");
                Console.WriteLine($"   - Statut actuel: {task.TaskStatusId}");
                Console.WriteLine($"   - Progress actuel: {task.Progress}%");
                Console.WriteLine($"   - IsValidated: {task.IsValidated}");

                if (task.AssignedToUserId != userId)
                {
                    Console.WriteLine($"❌ Tâche assignée à {task.AssignedToUserId}, pas à {userId}");
                    return StatusCode(403, new { success = false, message = "Vous ne pouvez modifier que vos propres tâches" });
                }

                // ✅ NE PAS MODIFIER SI DÉJÀ VALIDÉE
                if (task.TaskStatusId == 5)
                {
                    Console.WriteLine("❌ Tâche déjà VALIDÉE (statut 5) - Modification bloquée");
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Cette tâche a été validée par le chef de projet. Modification impossible."
                    });
                }

                // ✅ NE PAS MODIFIER SI EN ATTENTE DE VALIDATION
                if (task.TaskStatusId == 4 && dto.TaskStatusId != 2)
                {
                    Console.WriteLine("❌ Tâche EN ATTENTE (statut 4) - Modification bloquée");
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Cette tâche est en attente de validation. Contactez votre chef de projet."
                    });
                }

                Console.WriteLine("========================================");
                Console.WriteLine("🔄 DÉBUT DE LA MISE À JOUR");
                Console.WriteLine("========================================");

                // ✅ Mise à jour de la progression
                if (dto.Progress.HasValue)
                {
                    Console.WriteLine($"📊 Mise à jour Progress: {task.Progress}% → {dto.Progress.Value}%");
                    task.Progress = dto.Progress.Value;
                }

                Console.WriteLine($"🔍 Progress après mise à jour: {task.Progress}%");
                Console.WriteLine($"🔍 TaskStatusId reçu dans DTO: {dto.TaskStatusId}");

                // ✅ RÈGLE MÉTIER PRINCIPALE
                if (task.Progress == 100 || dto.TaskStatusId == 3)
                {
                    Console.WriteLine("========================================");
                    Console.WriteLine("🎯 CONDITION DÉCLENCHÉE !");
                    Console.WriteLine($"   - task.Progress == 100 ? {task.Progress == 100}");
                    Console.WriteLine($"   - dto.TaskStatusId == 3 ? {dto.TaskStatusId == 3}");
                    Console.WriteLine("   → Passage en statut 4 (En attente de validation)");
                    Console.WriteLine("========================================");

                    task.TaskStatusId = 4;
                    task.Progress = 100;
                    task.IsValidated = false;

                    Console.WriteLine($"✅ TaskStatusId changé → {task.TaskStatusId}");
                    Console.WriteLine($"✅ Progress forcé → {task.Progress}%");
                    Console.WriteLine($"✅ IsValidated → {task.IsValidated}");
                }
                else if (dto.TaskStatusId.HasValue && dto.TaskStatusId.Value != 3)
                {
                    Console.WriteLine($"🔄 Mise à jour statut normal: {task.TaskStatusId} → {dto.TaskStatusId.Value}");
                    task.TaskStatusId = dto.TaskStatusId.Value;
                }
                else
                {
                    Console.WriteLine("ℹ️ Aucun changement de statut");
                }

                Console.WriteLine("========================================");
                Console.WriteLine("💾 AVANT SAUVEGARDE:");
                Console.WriteLine($"   - TaskStatusId: {task.TaskStatusId}");
                Console.WriteLine($"   - Progress: {task.Progress}%");
                Console.WriteLine($"   - IsValidated: {task.IsValidated}");
                Console.WriteLine("========================================");

                await _context.SaveChangesAsync();

                Console.WriteLine("✅✅✅ SAUVEGARDE RÉUSSIE EN BASE DE DONNÉES");

                // Vérification post-save
                var savedTask = await _context.ProjectTasks.FindAsync(taskId);
                Console.WriteLine("========================================");
                Console.WriteLine("🔍 VÉRIFICATION POST-SAUVEGARDE:");
                Console.WriteLine($"   - TaskStatusId en BDD: {savedTask.TaskStatusId}");
                Console.WriteLine($"   - Progress en BDD: {savedTask.Progress}%");
                Console.WriteLine($"   - IsValidated en BDD: {savedTask.IsValidated}");
                Console.WriteLine("========================================");

                string statusName = task.TaskStatusId switch
                {
                    1 => "À faire",
                    2 => "En cours",
                    3 => "Terminé",
                    4 => "En attente de validation",
                    5 => "Validé",
                    _ => "Inconnu"
                };

                Console.WriteLine($"📤 Réponse envoyée: Statut={statusName}, Progress={task.Progress}%");
                Console.WriteLine("========================================\n");

                return Ok(new
                {
                    success = true,
                    message = task.TaskStatusId == 4
                        ? "Tâche terminée et envoyée au chef de projet pour validation !"
                        : $"Tâche mise à jour avec succès. Statut : {statusName}, Progression : {task.Progress}%",
                    data = new
                    {
                        taskId = task.ProjectTaskId,
                        taskStatusId = task.TaskStatusId,
                        statusName = statusName,
                        progress = task.Progress,
                        isValidated = task.IsValidated
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌❌❌ ERREUR CRITIQUE: {ex.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");
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
