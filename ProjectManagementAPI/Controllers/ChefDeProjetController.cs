using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
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

        public ProjectManagerController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // ============= DEBUG TOKEN =============
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
        [HttpGet("dashboard")]
        [ProducesResponseType(StatusCodes.Status200OK)]
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

                // ✅ Utilise TaskStatusId au lieu de comparer du texte
                var completedTasks = projects.Sum(p => p.ProjectTasks?.Count(t => t.TaskStatusId == 5) ?? 0);
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
                    var completed = tasks.Count(t => t.TaskStatusId == 5);

                    return new
                    {
                        projectId = p.ProjectId,
                        projectName = p.ProjectName,
                        totalTasks = totalTasksCount,
                        completedTasks = completed,
                        inProgressTasks = tasks.Count(t => t.TaskStatusId == 2),
                        todoTasks = tasks.Count(t => t.TaskStatusId == 1),
                        pendingValidationTasks = tasks.Count(t => t.TaskStatusId == 4),

                        progress = totalTasksCount > 0
                            ? (int)Math.Round((completed * 100.0) / totalTasksCount)
                            : 0,

                        isDelayed = p.EndDate.HasValue && p.EndDate.Value < DateTime.UtcNow &&
                            (totalTasksCount == 0 || (completed * 100.0 / totalTasksCount) < 100)
                    };
                }).ToList();

                var stats = new
                {
                    totalProjects,
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    tasksAwaitingValidation,
                    activeMembers
                };

                return Ok(new
                {
                    success = true,
                    message = "Dashboard chargé avec succès",
                    data = new { stats, projects = projectsList }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur Dashboard: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors du chargement du dashboard",
                    error = ex.Message
                });
            }
        }

        // ============= MES PROJETS ============= ✅ CORRIGÉ
        [HttpGet("my-projects")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProjects()
        {
            try
            {
                var userId = GetCurrentUserId();

                Console.WriteLine($"🔍 Récupération des projets pour userId={userId}");

                var projects = await _context.Projects
                    .Where(p => p.ProjectManagerId == userId)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Team)
                    .ToListAsync();

                Console.WriteLine($"📋 {projects.Count} projets trouvés");

                var projectsList = projects.Select(p =>
                {
                    // ✅ PROTECTION CONTRE NULL
                    var tasks = p.ProjectTasks ?? new List<ProjectTask>();
                    var totalTasks = tasks.Count;
                    var completedTasks = tasks.Count(t => t.TaskStatusId == 5);
                    var inProgressTasks = tasks.Count(t => t.TaskStatusId == 2);
                    var todoTasks = tasks.Count(t => t.TaskStatusId == 1);
                    var pendingValidationTasks = tasks.Count(t => t.TaskStatusId == 4);

                    // ✅ CALCUL SÉCURISÉ DE LA PROGRESSION
                    int progress = 0;
                    if (totalTasks > 0)
                    {
                        progress = (int)Math.Round((completedTasks * 100.0) / totalTasks);
                    }

                    // ✅ CALCUL DU RETARD
                    bool isDelayed = false;
                    if (p.EndDate.HasValue && p.EndDate.Value < DateTime.UtcNow)
                    {
                        if (totalTasks == 0 || progress < 100)
                        {
                            isDelayed = true;
                        }
                    }

                    Console.WriteLine($"📊 Projet '{p.ProjectName}': {totalTasks} tâches, {progress}% complété");

                    return new
                    {
                        projectId = p.ProjectId,
                        projectName = p.ProjectName,
                        description = p.Description ?? "",
                        statusName = p.ProjectStatus?.StatusName ?? "N/A",
                        statusColor = p.ProjectStatus?.Color ?? "#999",
                        teamName = p.Team?.teamName ?? "Aucune équipe",
                        totalTasks = totalTasks,
                        completedTasks = completedTasks,
                        inProgressTasks = inProgressTasks,
                        todoTasks = todoTasks,
                        pendingValidationTasks = pendingValidationTasks,
                        progress = progress,
                        isDelayed = isDelayed,
                        startDate = p.StartDate,
                        endDate = p.EndDate
                    };
                }).ToList();

                Console.WriteLine($"✅ Projets traités avec succès");

                return Ok(new
                {
                    success = true,
                    message = "Projets récupérés avec succès",
                    data = projectsList
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERREUR GetMyProjects: {ex.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets",
                    error = ex.Message
                });
            }
        }

        // ============= STATS D'UN PROJET =============
        [HttpGet("projects/{projectId}/stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
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
                {
                    return NotFound(new { success = false, message = "Projet non trouvé" });
                }

                if (project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à voir ce projet"
                    });
                }

                // ✅ PROTECTION CONTRE NULL
                var tasks = project.ProjectTasks ?? new List<ProjectTask>();
                var totalTasks = tasks.Count;
                var completedTasks = tasks.Count(t => t.TaskStatusId == 5);

                int progress = 0;
                if (totalTasks > 0)
                {
                    progress = (int)Math.Round((completedTasks * 100.0) / totalTasks);
                }

                bool isDelayed = false;
                if (project.EndDate.HasValue && project.EndDate.Value < DateTime.UtcNow)
                {
                    if (totalTasks == 0 || progress < 100)
                    {
                        isDelayed = true;
                    }
                }

                var stats = new
                {
                    projectId = project.ProjectId,
                    projectName = project.ProjectName,
                    description = project.Description ?? "",
                    statusName = project.ProjectStatus?.StatusName ?? "N/A",
                    statusColor = project.ProjectStatus?.Color ?? "#999",
                    teamName = project.Team?.teamName ?? "Aucune équipe",
                    totalTasks = totalTasks,
                    completedTasks = completedTasks,
                    inProgressTasks = tasks.Count(t => t.TaskStatusId == 2),
                    todoTasks = tasks.Count(t => t.TaskStatusId == 1),
                    pendingValidationTasks = tasks.Count(t => t.TaskStatusId == 4),
                    progress = progress,
                    isDelayed = isDelayed,
                    startDate = project.StartDate,
                    endDate = project.EndDate
                };

                return Ok(new
                {
                    success = true,
                    message = "Statistiques récupérées avec succès",
                    data = stats
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur Stats: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des statistiques",
                    error = ex.Message
                });
            }
        }

        // ============= TÂCHES D'UN PROJET =============
        [HttpGet("projects/{projectId}/tasks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProjectTasks(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                {
                    return NotFound(new { success = false, message = "Projet non trouvé" });
                }

                if (project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à voir ces tâches"
                    });
                }

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
                        isOverdue = t.DueDate < DateTime.Now && t.TaskStatusId != 4 && t.TaskStatusId != 5
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

        // ============= CRÉER UNE TÂCHE =============
        [HttpPost("tasks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Données invalides",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var userId = GetCurrentUserId();

                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId);

                if (project == null)
                {
                    return NotFound(new { success = false, message = "Projet non trouvé" });
                }

                if (project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à créer des tâches pour ce projet"
                    });
                }

                var task = new ProjectTask
                {
                    TaskName = dto.TaskName,
                    Description = dto.Description,
                    DueDate = dto.DueDate,
                    ProjectId = dto.ProjectId,
                    TaskStatusId = dto.TaskStatusId,
                    PriorityId = dto.PriorityId,
                    AssignedToUserId = dto.AssignedToUserId,
                    CreatedByUserId = userId,
                    Progress = 0
                };

                _context.ProjectTasks.Add(task);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Tâche créée avec succès",
                    data = new
                    {
                        taskId = task.ProjectTaskId,
                        taskName = task.TaskName
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la création de la tâche",
                    error = ex.Message
                });
            }
        }

        // ============= ASSIGNER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/assign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AssignTask(int taskId, [FromBody] AssignTaskDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Données invalides"
                    });
                }

                var userId = GetCurrentUserId();

                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                {
                    return NotFound(new { success = false, message = "Tâche non trouvée" });
                }

                if (task.Project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à assigner cette tâche"
                    });
                }

                var user = await _context.Users.FindAsync(dto.AssignedToUserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Utilisateur non trouvé" });
                }

                task.AssignedToUserId = dto.AssignedToUserId;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Tâche assignée à {user.FirstName} {user.LastName}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'assignation de la tâche",
                    error = ex.Message
                });
            }
        }

        // ============= MEMBRES DE L'ÉQUIPE D'UN PROJET =============
        [HttpGet("projects/{projectId}/team-members")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
                {
                    return NotFound(new { success = false, message = "Projet non trouvé" });
                }

                if (project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à voir ces membres"
                    });
                }

                var members = project.Team?.TeamMembers.Select(tm => new
                {
                    userId = tm.UserId,
                    fullName = tm.User.FirstName + " " + tm.User.LastName,
                    email = tm.User.Email,
                    roleName = tm.User.Role.RoleName,
                    isProjectManager = tm.IsProjectManager
                }).ToList();

                if (members == null || !members.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Aucun membre trouvé",
                        data = new List<object>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Membres récupérés avec succès",
                    data = members
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des membres",
                    error = ex.Message
                });
            }
        }

        // ============= TÂCHES EN ATTENTE DE VALIDATION =============
        [HttpGet("tasks/awaiting-validation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTasksAwaitingValidation()
        {
            try
            {
                var userId = GetCurrentUserId();

                var tasks = await _context.ProjectTasks
                    .Where(t => t.Project.ProjectManagerId == userId && t.TaskStatusId == 4)
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
                        progress = t.Progress
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
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des tâches en attente",
                    error = ex.Message
                });
            }
        }

        // ============= VALIDATION (ROUTE ALTERNATIVE) =============
        [HttpGet("validation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetValidationTasks()
        {
            return await GetTasksAwaitingValidation();
        }

        // ============= VALIDER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/validate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ValidateTask(int taskId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                {
                    return NotFound(new { success = false, message = "Tâche non trouvée" });
                }

                if (task.Project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à valider cette tâche"
                    });
                }

                task.TaskStatusId = 5;
                task.Progress = 100;
                task.IsValidated = true;
                task.ValidatedByUserId = userId;
                task.ValidatedAt = DateTime.UtcNow;

                Console.WriteLine($"✅ Validation: Tâche {taskId} '{task.TaskName}' validée par userId={userId} le {task.ValidatedAt}");

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Tâche '{task.TaskName}' validée avec succès",
                    data = new
                    {
                        taskId = task.ProjectTaskId,
                        validatedBy = userId,
                        validatedAt = task.ValidatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur validation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la validation de la tâche",
                    error = ex.Message
                });
            }
        }

        // ============= REFUSER UNE TÂCHE =============
        [HttpPut("tasks/{taskId}/reject")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
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
                {
                    return NotFound(new { success = false, message = "Tâche non trouvée" });
                }

                if (task.Project.ProjectManagerId != userId)
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Vous n'êtes pas autorisé à refuser cette tâche"
                    });
                }

                task.TaskStatusId = 2;
                task.IsValidated = false;

                if (!string.IsNullOrEmpty(dto.Reason))
                {
                    task.Description += $"\n\n⚠️ Refusé le {DateTime.Now:dd/MM/yyyy HH:mm}: {dto.Reason}";
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Tâche '{task.TaskName}' refusée et remise en cours"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors du refus de la tâche",
                    error = ex.Message
                });
            }
        }
    }
}
