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
            // ✅ ADD THESE DEBUG LOGS:
            Console.WriteLine($"📥 DTO received:");
            Console.WriteLine($"  ProjectName: {dto.ProjectName}");
            Console.WriteLine($"  ProjectManagerId: {dto.ProjectManagerId}");
            Console.WriteLine($"  CreatedByUserId: {dto.CreatedByUserId}");  // ← What shows here?
            var project = new Project
            {
                ProjectName = dto.ProjectName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TeamId = dto.TeamId,
                ProjectStatusId = dto.ProjectStatusId,
                PriorityId = dto.PriorityId,
                ProjectManagerId = dto.ProjectManagerId,
                Progress = 0,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = dto.CreatedByUserId,
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            var createdProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectTasks)
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
            var edb = await _context.EDBs.FindAsync(dto.EdbId);
            if (edb == null)
            {
                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "EDB introuvable"
                };
            }

            var project = new Project
            {
                ProjectName = dto.ProjectName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CreatedByUserId = dto.CreatedByUserId,
                TeamId = dto.TeamId,
                ProjectStatusId = dto.ProjectStatusId,
                PriorityId = dto.PriorityId,
                ProjectManagerId = dto.ProjectManagerId,
                Progress = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            edb.ProjectId = project.ProjectId;
            await _context.SaveChangesAsync();

            var createdProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectTasks)
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

            var updatedProject = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectTasks)
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
                Team = project.Team != null ? new TeamDTO
                {
                    TeamId = project.Team.teamId,
                    TeamName = project.Team.teamName
                } : null,
                Status = project.ProjectStatus != null ? new ProjectStatusDTO
                {
                    ProjectStatusId = project.ProjectStatus.ProjectStatusId,
                    StatusName = project.ProjectStatus.StatusName,
                    Color = project.ProjectStatus.Color
                } : null,
                Priority = project.Priority != null ? new PriorityDTO
                {
                    PriorityId = project.Priority.PriorityId,
                    Name = project.Priority.Name
                } : null,
                Tasks = project.ProjectTasks?.Select(t => new TaskDTO
                {
                    TaskId = t.ProjectTaskId,
                    TaskName = t.TaskName,
                    Progress = t.Progress,
                    StatusName = t.ProjectTasksStatus?.StatusName ?? "N/A"
                }).ToList() ?? new List<TaskDTO>(),
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
                .Include(p => p.ProjectManager)
                .ToListAsync();

            var projectDTOs = projects.Select(p => MapToProjectDTO(p)).ToList();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = "Projets récupérés",
                Data = projectDTOs
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
                .Include(p => p.ProjectManager)
                .ToListAsync();

            var projectDTOs = projects.Select(p => MapToProjectDTO(p)).ToList();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = "Projets de l'équipe récupérés",
                Data = projectDTOs
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
            Console.WriteLine($"📥 GetUserProjectsAsync called for userId: {userId}");

            var userTeamIds = await _context.TeamMembers
                .Where(tm => tm.UserId == userId && tm.IsActive)
                .Select(tm => tm.TeamId)
                .ToListAsync();

            Console.WriteLine($"✅ Found {userTeamIds.Count} team(s) for user");

            if (!userTeamIds.Any())
            {
                Console.WriteLine("⚠️ No teams found for this user");
                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Message = "Aucune équipe trouvée pour cet utilisateur",
                    Data = new List<ProjectDTO>()
                };
            }

            var projects = await _context.Projects
                .Where(p => p.TeamId.HasValue && userTeamIds.Contains(p.TeamId.Value))
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                .Include(p => p.ProjectManager)
                .ToListAsync();

            Console.WriteLine($"✅ Found {projects.Count} project(s)");

            var projectDTOs = projects.Select(p => MapToProjectDTO(p)).ToList();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = $"{projectDTOs.Count} projet(s) trouvé(s)",
                Data = projectDTOs
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ ERROR: {ex.Message}");
            return new ApiResponse<List<ProjectDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}",
                Data = new List<ProjectDTO>()
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
                TotalTasks = project.ProjectTasks?.Count ?? 0,
                CompletedTasks = project.ProjectTasks?.Count(t => t.Progress == 100) ?? 0,
                InProgressTasks = project.ProjectTasks?.Count(t => t.Progress > 0 && t.Progress < 100) ?? 0,
                TodoTasks = project.ProjectTasks?.Count(t => t.Progress == 0) ?? 0,
                Progress = project.Progress,
                IsDelayed = project.EndDate.HasValue && project.EndDate < DateTime.UtcNow && project.Progress < 100
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

    // ✅ CORRECTION : TeamId ajouté dans MapToProjectDTO
    private ProjectDTO MapToProjectDTO(Project p)
    {
        var taskCount = p.ProjectTasks?.Count ?? 0;
        var completedTaskCount = p.ProjectTasks?.Count(t => t.Progress == 100) ?? 0;

        int calculatedProgress = 0;
        if (taskCount > 0)
        {
            calculatedProgress = (int)Math.Round((double)completedTaskCount / taskCount * 100);
        }

        return new ProjectDTO
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName ?? "Sans nom",
            Description = p.Description ?? "",
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Progress = calculatedProgress,
            TeamId = p.TeamId ?? 0,                          // ✅ CORRECTION - était absent !
            TeamName = p.Team?.teamName ?? "N/A",
            ProjectManagerId = p.ProjectManagerId ?? 0,
            ProjectManagerName = p.ProjectManager != null
                ? $"{p.ProjectManager.FirstName} {p.ProjectManager.LastName}"
                : "Non assigné",
            StatusName = p.ProjectStatus?.StatusName ?? "N/A",
            StatusColor = p.ProjectStatus?.Color ?? "#000000",
            PriorityName = p.Priority?.Name ?? "N/A",
            TaskCount = taskCount,
            CompletedTaskCount = completedTaskCount,
            CreatedAt = p.CreatedAt,
            HasEdb = p.EDBs?.Any() ?? false
        };
    }

    public async Task<ApiResponse<bool>> AssignTeamToProjectAsync(int projectId, int teamId)
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

            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Équipe introuvable"
                };
            }

            project.TeamId = teamId;
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Équipe assignée au projet",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Erreur lors de l'assignation"
            };
        }
    }

    public async Task<ApiResponse<bool>> SetProjectManagerAsync(int teamMemberId, bool isProjectManager)
    {
        try
        {
            var teamMember = await _context.TeamMembers.FindAsync(teamMemberId);
            if (teamMember == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Membre introuvable"
                };
            }

            teamMember.IsProjectManager = isProjectManager;
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = isProjectManager ? "Chef de projet défini" : "Chef de projet retiré",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Erreur lors de la modification"
            };
        }
    }

    public async Task<ApiResponse<List<TeamMemberDTO>>> GetProjectTeamMembersAsync(int projectId, string? search)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.Team)
                    .ThenInclude(t => t.TeamMembers)
                        .ThenInclude(tm => tm.User)
                            .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);

            if (project == null || project.Team == null)
            {
                return new ApiResponse<List<TeamMemberDTO>>
                {
                    Success = false,
                    Message = "Projet ou équipe introuvable"
                };
            }

            var members = project.Team.TeamMembers
                .Where(tm => tm.IsActive)
                .AsEnumerable();

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                members = members.Where(tm =>
                    tm.User.FirstName.ToLower().Contains(search) ||
                    tm.User.LastName.ToLower().Contains(search) ||
                    tm.User.UserName.ToLower().Contains(search) ||
                    tm.User.Email.ToLower().Contains(search));
            }

            var teamMemberDTOs = members.Select(tm => new TeamMemberDTO
            {
                TeamMemberId = tm.TeamMemberId,
                TeamId = tm.TeamId,
                TeamName = project.Team.teamName,
                UserId = tm.UserId,
                UserName = tm.User.UserName,
                FirstName = tm.User.FirstName,
                LastName = tm.User.LastName,
                FullName = $"{tm.User.FirstName} {tm.User.LastName}",
                Email = tm.User.Email,
                RoleId = tm.User.RoleId,
                RoleName = tm.User.Role.RoleName,
                IsProjectManager = tm.IsProjectManager,
                IsActive = tm.IsActive,
                JoinedDate = tm.JoinedDate
            }).ToList();

            return new ApiResponse<List<TeamMemberDTO>>
            {
                Success = true,
                Message = $"{teamMemberDTOs.Count} membre(s) trouvé(s)",
                Data = teamMemberDTOs
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TeamMemberDTO>>
            {
                Success = false,
                Message = "Erreur lors de la récupération"
            };
        }
    }

    public async Task<ApiResponse<bool>> AssignProjectManagerAsync(int projectId, int userId)
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

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Utilisateur introuvable"
                };
            }

            var isTeamMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == project.TeamId && tm.UserId == userId && tm.IsActive);

            if (!isTeamMember)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "L'utilisateur doit faire partie de l'équipe du projet"
                };
            }

            project.ProjectManagerId = userId;
            await _context.SaveChangesAsync();

            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == project.TeamId && tm.UserId == userId);

            if (teamMember != null)
            {
                teamMember.IsProjectManager = true;
                await _context.SaveChangesAsync();
            }

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Chef de projet assigné avec succès",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = $"Erreur : {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<ProjectDTO>>> GetManagedProjectsAsync(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = false,
                    Message = "Utilisateur introuvable"
                };
            }

            var projects = await _context.Projects
                .Where(p => p.ProjectManagerId == userId)
                .Include(p => p.Team)
                .Include(p => p.ProjectStatus)
                .Include(p => p.Priority)
                .Include(p => p.ProjectTasks)
                .Include(p => p.ProjectManager)
                .ToListAsync();

            var projectDtos = projects.Select(p => MapToProjectDTO(p)).ToList();

            return new ApiResponse<List<ProjectDTO>>
            {
                Success = true,
                Message = $"{projectDtos.Count} projet(s) géré(s) par cet utilisateur",
                Data = projectDtos
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProjectDTO>>
            {
                Success = false,
                Message = $"Erreur : {ex.Message}"
            };
        }
    }
}
