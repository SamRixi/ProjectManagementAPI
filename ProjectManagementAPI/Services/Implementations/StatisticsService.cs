using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Services.Implementations
{
    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<GlobalStatsDTO>> GetGlobalStatsAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.ProjectTasks)
                    .ToListAsync();

                var allTasks = await _context.ProjectTasks.ToListAsync();
                var totalTeams = await _context.Teams.CountAsync();

                var stats = new GlobalStatsDTO
                {
                    TotalProjects = projects.Count,
                    ActiveProjects = projects.Count(p => p.ProjectStatus.StatusName != "Terminé"),
                    CompletedProjects = projects.Count(p => p.ProjectStatus.StatusName == "Terminé"),
                    TotalTasks = allTasks.Count,
                    CompletedTasks = allTasks.Count(t => t.Progress == 100),
                    TotalTeams = totalTeams,
                    AverageProgress = projects.Count > 0
                        ? (int)projects.Average(p => p.Progress)
                        : 0,
                    DelayedProjects = projects.Count(p =>
                        p.EndDate < DateTime.UtcNow && p.ProjectStatus.StatusName != "Terminé")
                };

                return new ApiResponse<GlobalStatsDTO>
                {
                    Success = true,
                    Message = "Statistiques globales récupérées",
                    Data = stats
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<GlobalStatsDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<ProjectStatsDTO>> GetProjectStatsAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectTasks)
                        .ThenInclude(t => t.ProjectTasksStatus)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                {
                    return new ApiResponse<ProjectStatsDTO>
                    {
                        Success = false,
                        Message = "Projet introuvable"
                    };
                }

                var tasks = project.ProjectTasks;

                var stats = new ProjectStatsDTO
                {
                    ProjectId = project.ProjectId,
                    ProjectName = project.ProjectName,
                    TotalTasks = tasks.Count,
                    CompletedTasks = tasks.Count(t => t.Progress == 100),
                    InProgressTasks = tasks.Count(t => t.Progress > 0 && t.Progress < 100),
                    TodoTasks = tasks.Count(t => t.Progress == 0),
                    Progress = project.Progress,
                    IsDelayed = project.EndDate < DateTime.UtcNow && project.Progress < 100
                };

                return new ApiResponse<ProjectStatsDTO>
                {
                    Success = true,
                    Message = "Statistiques du projet récupérées",
                    Data = stats
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ProjectStatsDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }
    }
}
