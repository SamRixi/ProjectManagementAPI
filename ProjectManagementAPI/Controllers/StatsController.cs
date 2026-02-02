using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;

namespace ProjectManagementAPI.Controllers
{
    /// <summary>
    /// StatsController - Statistiques globales (Manager/Reporting uniquement)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Manager,Reporting")]
    [Produces("application/json")]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Récupère les statistiques globales pour le dashboard admin
        /// </summary>
        /// <returns>Statistiques globales</returns>
        /// <response code="200">Statistiques récupérées avec succès</response>
        /// <response code="500">Erreur serveur</response>
        [HttpGet("global")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGlobalStats()
        {
            try
            {
                var totalProjects = await _context.Projects.CountAsync();

                var activeProjects = await _context.Projects
                    .Where(p => p.EndDate >= DateTime.UtcNow) // ✅ Utilise UtcNow
                    .CountAsync();

                var totalUsers = await _context.Users.CountAsync();

                var activeUsers = await _context.Users
                    .Where(u => u.IsActive)
                    .CountAsync();

                var totalTeams = await _context.Teams.CountAsync();

                var totalTasks = await _context.ProjectTasks.CountAsync();

                // ✅ CORRIGÉ: Compare TaskStatusId au lieu de ProjectTaskId
                var completedTasks = await _context.ProjectTasks
                    .Where(t => t.TaskStatusId == 3) // Assuming TaskStatusId 3 = Completed
                    .CountAsync();

                // ✅ BONUS: Tâches validées
                var validatedTasks = await _context.ProjectTasks
                    .Where(t => t.IsValidated)
                    .CountAsync();

                // ✅ BONUS: Tâches en retard
                var overdueTasks = await _context.ProjectTasks
                    .Where(t => t.DueDate < DateTime.UtcNow && !t.IsValidated)
                    .CountAsync();

                // ✅ BONUS: Progression moyenne
                var avgProgress = await _context.Projects
                    .AverageAsync(p => (double?)p.Progress) ?? 0;

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
                    pendingTasks = totalTasks - completedTasks
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
        /// <returns>Statistiques par projet</returns>
        [HttpGet("projects")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProjectsStats()
        {
            try
            {
                var projectStats = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.Team)
                    .Include(p => p.ProjectManager) // ✅ Include ProjectManager
                    .Select(p => new
                    {
                        p.ProjectId,
                        p.ProjectName,
                        teamName = p.Team.teamName,
                        projectManagerName = p.ProjectManager.FirstName + " " + p.ProjectManager.LastName, // ✅ NEW
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
                        t.ProjectTasksStatus.StatusName,
                        t.ProjectTasksStatus.Color
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
