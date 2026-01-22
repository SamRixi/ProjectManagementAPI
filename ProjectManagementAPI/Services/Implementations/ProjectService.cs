using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;

    public ProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ProjectDTO>> CreateProjectAsync(CreateProjectDTO dto)
    {
        try
        {
            var project = new Project
            {
                ProjectName = dto.ProjectName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TeamId = dto.TeamId,
                ProjectStatusId = dto.ProjectStatusId,
                PriorityId = dto.PriorityId,
                Progress = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Recharger avec les relations
            var createdProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .FirstOrDefaultAsync(p => p.ProjectId == project.ProjectId);

            return new ApiResponse<ProjectDTO>
            {
                Success = true,
                Message = "Projet créé avec succès",
                Data = MapToProjectDTO(createdProject)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProjectDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<ProjectDTO>> CreateProjectWithEdbAsync(CreateProjectWithEdbDTO dto)
    {
        try
        {
            // Vérifier que l'EDB existe
            var edb = await _context.EDBs.FindAsync(dto.EdbId);
            if (edb == null)
            {
                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "EDB introuvable"
                };
            }

            // Créer le projet
            var project = new Project
            {
                ProjectName = dto.ProjectName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TeamId = dto.TeamId,
                ProjectStatusId = dto.ProjectStatusId,
                PriorityId = dto.PriorityId,
                Progress = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Lier l'EDB au projet
            edb.ProjectId = project.ProjectId;
            await _context.SaveChangesAsync();

            // Recharger avec relations
            var createdProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .FirstOrDefaultAsync(p => p.ProjectId == project.ProjectId);

            return new ApiResponse<ProjectDTO>
            {
                Success = true,
                Message = "Projet créé avec EDB avec succès",
                Data = MapToProjectDTO(createdProject)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProjectDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<ProjectDTO>> UpdateProjectAsync(UpdateProjectDTO dto)
    {
        try
        {
            var project = await _context.Projects.FindAsync(dto.ProjectId);

            if (project == null)
            {
                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "Projet introuvable"
                };
            }

            project.ProjectName = dto.ProjectName;
            project.Description = dto.Description;
            project.StartDate = dto.StartDate;
            project.EndDate = dto.EndDate;
            project.ProjectStatusId = dto.ProjectStatusId;
            project.PriorityId = dto.PriorityId;

            await _context.SaveChangesAsync();

            // Recharger
            var updatedProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId);

            return new ApiResponse<ProjectDTO>
            {
                Success = true,
                Message = "Projet mis à jour",
                Data = MapToProjectDTO(updatedProject)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProjectDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<bool>> DeleteProjectAsync(int projectId)
    {
        try
        {
            var project = await _context.Projects.FindAsync(projectId);

            if (project == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Projet introuvable"
                };
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Projet supprimé",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<ProjectDetailsDTO>> GetProjectByIdAsync(int projectId)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                    .ThenInclude(t => t.ProjectTasksStatus)
                .Include(p => p.ProjectTasks)
                    .ThenInclude(t => t.Priority)
                .Include(p => p.EDBs)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);

            if (project == null)
            {
                return new ApiResponse<ProjectDetailsDTO>
                {
                    Success = false,
                    Message = "Projet introuvable"
                };
            }

            var details = new ProjectDetailsDTO
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName,
                Description = project.Description,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Progress = project.Progress,
                Team = new TeamDTO
                {
                    TeamId = project.Team.teamId,
                    TeamName = project.Team.teamName
                },
                Status = new ProjectStatusDTO
                {
                    ProjectStatusId = project.ProjectStatus.ProjectStatusId,
                    StatusName = project.ProjectStatus.StatusName,
                    Color = project.ProjectStatus.Color
                },
                Priority = new PriorityDTO
                {
                    PriorityId = project.Priority.PriorityId,
                    Name = project.Priority.Name
                },
                Tasks = project.ProjectTasks.Select(t => new TaskDTO
                {
                    TaskId = t.ProjectTaskId,
                    TaskName = t.TaskName,
                    Progress = t.Progress,
                    StatusName = t.ProjectTasksStatus.StatusName
                }).ToList(),
                CreatedAt = project.CreatedAt
            };

            return new ApiResponse<ProjectDetailsDTO>
            {
                Success = true,
                Message = "Projet récupéré",
                Data = details
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProjectDetailsDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<ProjectDTO>>> GetAllProjectsAsync()
    {
        try
        {
            var projects = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                .Select(p => MapToProjectDTO(p))
                .ToListAsync();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = "Projets récupérés",
                Data = projects
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProjectDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<ProjectDTO>>> GetTeamProjectsAsync(int teamId)
    {
        try
        {
            var projects = await _context.Projects
                .Where(p => p.TeamId == teamId)
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                .Select(p => MapToProjectDTO(p))
                .ToListAsync();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = "Projets de l'équipe récupérés",
                Data = projects
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProjectDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<ProjectDTO>>> GetUserProjectsAsync(int userId)
    {
        try
        {
            // Récupérer les équipes de l'utilisateur
            var userTeamIds = await _context.TeamMembers
                .Where(tm => tm.UserId == userId)
                .Select(tm => tm.TeamId)
                .ToListAsync();

            // Récupérer les projets de ces équipes
            var projects = await _context.Projects
                .Where(p => userTeamIds.Contains(p.TeamId))
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                .Select(p => MapToProjectDTO(p))
                .ToListAsync();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = "Projets de l'utilisateur récupérés",
                Data = projects
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProjectDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<ProjectStatsDTO>> GetProjectStatsAsync(int projectId)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.ProjectTasks)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);

            if (project == null)
            {
                return new ApiResponse<ProjectStatsDTO>
                {
                    Success = false,
                    Message = "Projet introuvable"
                };
            }

            var stats = new ProjectStatsDTO
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName,
                TotalTasks = project.ProjectTasks.Count,
                CompletedTasks = project.ProjectTasks.Count(t => t.Progress == 100),
                InProgressTasks = project.ProjectTasks.Count(t => t.Progress > 0 && t.Progress < 100),
                TodoTasks = project.ProjectTasks.Count(t => t.Progress == 0),
                Progress = project.Progress,
                IsDelayed = project.EndDate < DateTime.UtcNow && project.Progress < 100
            };

            return new ApiResponse<ProjectStatsDTO>
            {
                Success = true,
                Message = "Statistiques récupérées",
                Data = stats
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProjectStatsDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    private ProjectDTO MapToProjectDTO(Project p)
    {
        return new ProjectDTO
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Progress = p.Progress,
            TeamName = p.Team.teamName,
            StatusName = p.ProjectStatus.StatusName,
            StatusColor = p.ProjectStatus.Color,
            PriorityName = p.Priority.Name,
            TaskCount = p.ProjectTasks.Count,
            CompletedTaskCount = p.ProjectTasks.Count(t => t.Progress == 100),
            CreatedAt = p.CreatedAt
        };
    }

    public Task<ApiResponse<bool>> AssignTeamToProjectAsync(int projectId, int teamId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> SetProjectManagerAsync(int teamMemberId, bool isProjectManager)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<TeamMemberDTO>>> GetProjectTeamMembersAsync(int projectId, string? search)
    {
        throw new NotImplementedException();
    }
}
