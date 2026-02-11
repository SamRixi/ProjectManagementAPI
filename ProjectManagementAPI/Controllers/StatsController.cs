using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;

namespace ProjectManagementAPI.Controllers
{
    /// <summary>
    /// StatsController - Statistiques (Manager / Reporting)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Authentifié, rôles gérés par action
    [Produces("application/json")]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Récupère les statistiques globales pour le dashboard Manager
        /// </summary>
        [HttpGet("global")]
        [Authorize(Roles = "Manager")] // 🔐 Manager uniquement
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGlobalStats()
        {
            try
            {
                var totalProjects = await _context.Projects.CountAsync();

                var activeProjects = await _context.Projects
                    .Where(p => p.EndDate >= DateTime.UtcNow)
                    .CountAsync();

                var totalUsers = await _context.Users.CountAsync();

                var activeUsers = await _context.Users
                    .Where(u => u.IsActive)
                    .CountAsync();

                var totalTeams = await _context.Teams.CountAsync();

                var totalTasks = await _context.ProjectTasks.CountAsync();

                var completedTasks = await _context.ProjectTasks
                    .Where(t => t.TaskStatusId == 3) // 3 = Completed
                    .CountAsync();

                var validatedTasks = await _context.ProjectTasks
                    .Where(t => t.IsValidated)
                    .CountAsync();

                var overdueTasks = await _context.ProjectTasks
                    .Where(t => t.DueDate < DateTime.UtcNow && !t.IsValidated)
                    .CountAsync();

                var avgProgress = await _context.Projects
                    .Select(p => (double?)p.Progress)
                    .AverageAsync() ?? 0;

                var pendingTasks = await _context.ProjectTasks
                    .Where(t => t.TaskStatusId != 3)
                    .CountAsync();

                var stats = new
                {
                    // Projets
                    totalProjects,
                    activeProjects,
                    completedProjects = totalProjects - activeProjects,
                    avgProjectProgress = Math.Round(avgProgress, 1),

                    // Utilisateurs
                    totalUsers,
                    activeUsers,
                    inactiveUsers = totalUsers - activeUsers,

                    // Équipes
                    totalTeams,

                    // Tâches
                    totalTasks,
                    completedTasks,
                    validatedTasks,
                    overdueTasks,
                    pendingTasks
                };

                return Ok(new
                {
                    success = true,
                    data = stats,
                    message = "Statistiques récupérées avec succès"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des statistiques",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Récupère les statistiques détaillées par projet
        /// </summary>
        [HttpGet("projects")]
        [Authorize(Roles = "Manager,Reporting")] // 🔐 Manager + Reporting
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProjectsStats()
        {
            try
            {
                var projectStats = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.Team)
                    .Include(p => p.ProjectManager)
                    .Select(p => new
                    {
                        p.ProjectId,
                        p.ProjectName,
                        teamName = p.Team != null ? p.Team.teamName : null,
                        projectManagerName = p.ProjectManager != null
                            ? p.ProjectManager.FirstName + " " + p.ProjectManager.LastName
                            : null,
                        p.Progress,
                        totalTasks = p.ProjectTasks.Count,
                        completedTasks = p.ProjectTasks.Count(t => t.TaskStatusId == 3),
                        overdueTasks = p.ProjectTasks.Count(t => t.DueDate < DateTime.UtcNow && !t.IsValidated),
                        p.StartDate,
                        p.EndDate
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = projectStats,
                    message = "Statistiques des projets récupérées"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des statistiques",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Récupère les statistiques par statut de tâche
        /// </summary>
        [HttpGet("tasks-by-status")]
        [Authorize(Roles = "Manager,Reporting")] // 🔐 Manager + Reporting
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTasksByStatus()
        {
            try
            {
                var tasksByStatus = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .GroupBy(t => new
                    {
                        t.TaskStatusId,
                        StatusName = t.ProjectTasksStatus.StatusName,
                        Color = t.ProjectTasksStatus.Color
                    })
                    .Select(g => new
                    {
                        statusId = g.Key.TaskStatusId,
                        statusName = g.Key.StatusName,
                        color = g.Key.Color,
                        count = g.Count()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = tasksByStatus,
                    message = "Statistiques par statut récupérées"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des statistiques",
                    error = ex.Message
                });
            }
        }
    }
}
