using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly ApplicationDbContext _context;

        public ProjectService(ApplicationDbContext context)
        {
            _context = context;
        }

        private const int STATUS_PLANIFIE = 1;
        private const int STATUS_EN_COURS = 2;
        private const int STATUS_TERMINE = 3;
        private const int STATUS_ANNULE = 4;

        // ─────────────────────────────────────────────────────────────
        // CLOSE PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> CloseProjectAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                if (project.ProjectStatusId == STATUS_ANNULE)
                    return new ApiResponse<bool> { Success = false, Message = "Impossible de clôturer un projet annulé" };

                var tasks = project.ProjectTasks?.ToList() ?? new List<ProjectTask>();

                if (tasks.Any() && !tasks.All(t => t.IsValidated))
                {
                    var notValidated = tasks.Count(t => !t.IsValidated);
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = $"Impossible de clôturer : {notValidated} tâche(s) non validée(s) par le Chef de Projet"
                    };
                }

                project.ProjectStatusId = STATUS_TERMINE;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool> { Success = true, Message = "Projet clôturé avec succès", Data = true };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // CREATE PROJECT (avec EdbId optionnel)
        // ─────────────────────────────────────────────────────────────
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
                    ProjectStatusId = STATUS_PLANIFIE,
                    PriorityId = dto.PriorityId,
                    ProjectManagerId = dto.ProjectManagerId,
                    Progress = 0,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = dto.CreatedByUserId,
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                // ✅ FIX : lier l'EDB si fournie dans le DTO
                if (dto.EdbId.HasValue)
                {
                    var edb = await _context.EDBs.FindAsync(dto.EdbId.Value);
                    if (edb != null)
                    {
                        edb.ProjectId = project.ProjectId;
                        await _context.SaveChangesAsync();
                    }
                }

                if (project.ProjectManagerId.HasValue && project.ProjectManagerId.Value > 0)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = project.ProjectManagerId.Value,
                        Title = "🆕 Nouveau projet assigné",
                        Message = $"Vous avez été désigné chef de projet sur « {project.ProjectName} ».",
                        Type = "PROJECT_ASSIGNED",
                        RelatedProjectId = project.ProjectId,
                        RelatedUserId = project.ProjectManagerId.Value,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }

                var createdProject = await _context.Projects
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectManager)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.EDBs)  // ✅ inclure EDBs dans le retour
                    .FirstOrDefaultAsync(p => p.ProjectId == project.ProjectId);

                return new ApiResponse<ProjectDTO>
                {
                    Success = true,
                    Message = dto.EdbId.HasValue ? "Projet créé avec EDB avec succès" : "Projet créé avec succès",
                    Data = MapToProjectDTO(createdProject)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ProjectDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // CREATE PROJECT WITH EDB (redirige vers CreateProjectAsync)
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<ProjectDTO>> CreateProjectWithEdbAsync(CreateProjectWithEdbDTO dto)
        {
            // ✅ FIX : évite la duplication, réutilise CreateProjectAsync
            var createDto = new CreateProjectDTO
            {
                ProjectName = dto.ProjectName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TeamId = dto.TeamId,
                PriorityId = dto.PriorityId,
                ProjectManagerId = dto.ProjectManagerId,
                CreatedByUserId = dto.CreatedByUserId,
                EdbId = dto.EdbId
            };
            return await CreateProjectAsync(createDto);
        }

        // ─────────────────────────────────────────────────────────────
        // UPDATE PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<ProjectDTO>> UpdateProjectAsync(UpdateProjectDTO dto)
        {
            try
            {
                var project = await _context.Projects.FindAsync(dto.ProjectId);
                if (project == null)
                    return new ApiResponse<ProjectDTO> { Success = false, Message = "Projet introuvable" };

                var oldPmId = project.ProjectManagerId;

                project.ProjectName = dto.ProjectName;
                project.Description = dto.Description;
                project.StartDate = dto.StartDate;
                project.EndDate = dto.EndDate;
                project.ProjectStatusId = dto.ProjectStatusId;
                project.PriorityId = dto.PriorityId;
                project.ProjectManagerId = dto.ProjectManagerId ?? project.ProjectManagerId;

                await _context.SaveChangesAsync();

                if (oldPmId != project.ProjectManagerId && project.ProjectManagerId.HasValue)
                {
                    var newPmId = project.ProjectManagerId.Value;
                    _context.Notifications.Add(new Notification
                    {
                        UserId = newPmId,
                        Title = "📌 Projet assigné",
                        Message = $"Vous êtes maintenant chef de projet sur « {project.ProjectName} ».",
                        Type = "PROJECT_ASSIGNED",
                        RelatedProjectId = project.ProjectId,
                        RelatedUserId = newPmId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }

                var updatedProject = await _context.Projects
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectManager)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.EDBs)  // ✅ inclure EDBs
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
                return new ApiResponse<ProjectDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // DELETE PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> DeleteProjectAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                // Étape 1 : Nullifier RelatedProjectId dans les notifications
                var notifsByProject = await _context.Notifications
                    .Where(n => n.RelatedProjectId == projectId)
                    .ToListAsync();
                foreach (var n in notifsByProject)
                    n.RelatedProjectId = null;

                // Étape 2 : Récupérer les IDs des tâches de ce projet
                var taskIds = await _context.ProjectTasks
                    .Where(t => t.ProjectId == projectId)
                    .Select(t => t.ProjectTaskId)
                    .ToListAsync();

                // Étape 3 : Nullifier RelatedTaskId dans les notifications liées à ces tâches
                if (taskIds.Any())
                {
                    var notifsByTask = await _context.Notifications
                        .Where(n => n.RelatedTaskId.HasValue && taskIds.Contains(n.RelatedTaskId.Value))
                        .ToListAsync();
                    foreach (var n in notifsByTask)
                        n.RelatedTaskId = null;
                }

                // ✅ Étape 4 : Détacher les EDBs (nullifier ProjectId) avant suppression
                var edbs = await _context.EDBs
                    .Where(e => e.ProjectId == projectId)
                    .ToListAsync();
                foreach (var e in edbs)
                    e.ProjectId = null;

                // Étape 5 : Sauvegarder tous les NULL
                await _context.SaveChangesAsync();

                // Étape 6 : Supprimer le projet (cascade supprime les tâches auto)
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool> { Success = true, Message = "Projet supprimé", Data = true };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // CANCEL PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> CancelProjectAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                project.ProjectStatusId = STATUS_ANNULE;

                if (project.ProjectTasks != null && project.ProjectTasks.Any())
                {
                    foreach (var task in project.ProjectTasks)
                        task.TaskStatusId = 6;
                }

                await _context.SaveChangesAsync();
                return new ApiResponse<bool> { Success = true, Message = "Projet annulé avec succès", Data = true };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET PROJECT BY ID
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<ProjectDetailsDTO>> GetProjectByIdAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectManager)
                    .Include(p => p.ProjectTasks)
                        .ThenInclude(t => t.ProjectTasksStatus)
                    .Include(p => p.ProjectTasks)
                        .ThenInclude(t => t.Priority)
                    .Include(p => p.EDBs)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return new ApiResponse<ProjectDetailsDTO> { Success = false, Message = "Projet introuvable" };

                var details = new ProjectDetailsDTO
                {
                    ProjectManagerId = project.ProjectManagerId,
                    ProjectManagerName = project.ProjectManager != null
                        ? $"{project.ProjectManager.FirstName} {project.ProjectManager.LastName}"
                        : "Non assigné",
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
                    TeamName = project.Team?.teamName ?? "Non assignée",
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
                    // ✅ FIX : exposer les EDBs dans les détails du projet
                    EDBs = project.EDBs?.Select(e => new EdbDTO
                    {
                        EdbId = e.EdbId,
                        FileName = e.FileName,
                        UploadedAt = e.UploadedAt
                    }).ToList() ?? new List<EdbDTO>(),
                    HasEdb = project.EDBs?.Any() ?? false,
                    CreatedAt = project.CreatedAt
                };

                return new ApiResponse<ProjectDetailsDTO> { Success = true, Message = "Projet récupéré", Data = details };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ProjectDetailsDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET ALL PROJECTS
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<List<ProjectDTO>>> GetAllProjectsAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.EDBs)
                    .Include(p => p.ProjectManager)
                    .ToListAsync();

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Message = "Projets récupérés",
                    Data = projects.Select(p => MapToProjectDTO(p)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<ProjectDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET TEAM PROJECTS
        // ─────────────────────────────────────────────────────────────
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
                    .Include(p => p.EDBs)
                    .Include(p => p.ProjectManager)
                    .ToListAsync();

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Message = "Projets de l'équipe récupérés",
                    Data = projects.Select(p => MapToProjectDTO(p)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<ProjectDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET USER PROJECTS
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<List<ProjectDTO>>> GetUserProjectsAsync(int userId)
        {
            try
            {
                var userTeamIds = await _context.TeamMembers
                    .Where(tm => tm.UserId == userId && tm.IsActive)
                    .Select(tm => tm.TeamId)
                    .ToListAsync();

                if (!userTeamIds.Any())
                    return new ApiResponse<List<ProjectDTO>>
                    {
                        Success = true,
                        Message = "Aucune équipe trouvée pour cet utilisateur",
                        Data = new List<ProjectDTO>()
                    };

                var projects = await _context.Projects
                    .Where(p => p.TeamId.HasValue && userTeamIds.Contains(p.TeamId.Value))
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.EDBs)
                    .Include(p => p.ProjectManager)
                    .ToListAsync();

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Message = $"{projects.Count} projet(s) trouvé(s)",
                    Data = projects.Select(p => MapToProjectDTO(p)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}",
                    Data = new List<ProjectDTO>()
                };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET PROJECT STATS
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<ProjectStatsDTO>> GetProjectStatsAsync(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectTasks)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return new ApiResponse<ProjectStatsDTO> { Success = false, Message = "Projet introuvable" };

                var stats = new ProjectStatsDTO
                {
                    ProjectId = project.ProjectId,
                    ProjectName = project.ProjectName,
                    TotalTasks = project.ProjectTasks?.Count ?? 0,
                    CompletedTasks = project.ProjectTasks?.Count(t => t.Progress == 100) ?? 0,
                    InProgressTasks = project.ProjectTasks?.Count(t => t.Progress > 0 && t.Progress < 100) ?? 0,
                    TodoTasks = project.ProjectTasks?.Count(t => t.Progress == 0) ?? 0,
                    Progress = project.Progress,
                    StartDate = project.StartDate,
                    EndDate = project.EndDate,
                    IsDelayed = project.EndDate.HasValue && project.EndDate < DateTime.UtcNow && project.Progress < 100
                };

                return new ApiResponse<ProjectStatsDTO> { Success = true, Message = "Statistiques récupérées", Data = stats };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ProjectStatsDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // ASSIGN TEAM TO PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> AssignTeamToProjectAsync(int projectId, int teamId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                var team = await _context.Teams.FindAsync(teamId);
                if (team == null)
                    return new ApiResponse<bool> { Success = false, Message = "Équipe introuvable" };

                project.TeamId = teamId;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool> { Success = true, Message = "Équipe assignée au projet", Data = true };
            }
            catch (Exception)
            {
                return new ApiResponse<bool> { Success = false, Message = "Erreur lors de l'assignation" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // SET PROJECT MANAGER (via TeamMember)
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> SetProjectManagerAsync(int teamId, int userId, bool isProjectManager)
        {
            try
            {
                var teamMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

                if (teamMember == null)
                    return new ApiResponse<bool> { Success = false, Message = "Membre introuvable" };

                teamMember.IsProjectManager = isProjectManager;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = isProjectManager ? "Chef de projet défini" : "Chef de projet retiré",
                    Data = true
                };
            }
            catch (Exception)
            {
                return new ApiResponse<bool> { Success = false, Message = "Erreur lors de la modification" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET PROJECT TEAM MEMBERS
        // ─────────────────────────────────────────────────────────────
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
                    return new ApiResponse<List<TeamMemberDTO>> { Success = false, Message = "Projet ou équipe introuvable" };

                var members = project.Team.TeamMembers.Where(tm => tm.IsActive).AsEnumerable();

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
            catch (Exception)
            {
                return new ApiResponse<List<TeamMemberDTO>> { Success = false, Message = "Erreur lors de la récupération" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // ASSIGN PROJECT MANAGER
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> AssignProjectManagerAsync(int projectId, int userId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<bool> { Success = false, Message = "Utilisateur introuvable" };

                var isTeamMember = await _context.TeamMembers
                    .AnyAsync(tm => tm.TeamId == project.TeamId && tm.UserId == userId && tm.IsActive);

                if (!isTeamMember)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "L'utilisateur doit faire partie de l'équipe du projet"
                    };

                project.ProjectManagerId = userId;
                await _context.SaveChangesAsync();

                var teamMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(tm => tm.TeamId == project.TeamId && tm.UserId == userId);

                if (teamMember != null)
                {
                    teamMember.IsProjectManager = true;
                    await _context.SaveChangesAsync();
                }

                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "📌 Nouveau projet assigné",
                    Message = $"Vous avez été désigné chef de projet sur « {project.ProjectName} ».",
                    Type = "PROJECT_ASSIGNED",
                    RelatedProjectId = project.ProjectId,
                    RelatedUserId = userId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return new ApiResponse<bool> { Success = true, Message = "Chef de projet assigné avec succès", Data = true };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // GET MANAGED PROJECTS
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<List<ProjectDTO>>> GetManagedProjectsAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new ApiResponse<List<ProjectDTO>> { Success = false, Message = "Utilisateur introuvable" };

                var projects = await _context.Projects
                    .Where(p => p.ProjectManagerId == userId)
                    .Include(p => p.Team)
                    .Include(p => p.ProjectStatus)
                    .Include(p => p.Priority)
                    .Include(p => p.ProjectTasks)
                    .Include(p => p.EDBs)
                    .Include(p => p.ProjectManager)
                    .ToListAsync();

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Message = $"{projects.Count} projet(s) géré(s)",
                    Data = projects.Select(p => MapToProjectDTO(p)).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<ProjectDTO>> { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // ASSIGN EDB TO PROJECT
        // ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> AssignEdbToProjectAsync(int projectId, int edbId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.EDBs)
                    .FirstOrDefaultAsync(p => p.ProjectId == projectId);

                if (project == null)
                    return new ApiResponse<bool> { Success = false, Message = "Projet introuvable" };

                var edb = await _context.EDBs.FirstOrDefaultAsync(e => e.EdbId == edbId);
                if (edb == null)
                    return new ApiResponse<bool> { Success = false, Message = "EDB introuvable" };

                // ✅ FIX : vérifier si l'EDB est déjà liée à un autre projet
                if (edb.ProjectId.HasValue && edb.ProjectId != projectId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Cette EDB est déjà assignée à un autre projet"
                    };

                edb.ProjectId = projectId;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "EDB assignée au projet avec succès",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur lors de l'assignation de l'EDB : {ex.Message}"
                };
            }
        }

        // ─────────────────────────────────────────────────────────────
        // MAP TO PROJECT DTO
        // ─────────────────────────────────────────────────────────────
        private ProjectDTO MapToProjectDTO(Project p)
        {
            var taskCount = p.ProjectTasks?.Count ?? 0;
            var completedTaskCount = p.ProjectTasks?.Count(t => t.Progress == 100) ?? 0;
            var validatedTaskCount = p.ProjectTasks?.Count(t => t.IsValidated) ?? 0;
            var pendingValidationCount = p.ProjectTasks?.Count(t => t.TaskStatusId == 4) ?? 0;
            var notFinishedCount = p.ProjectTasks?.Count(t => t.Progress < 100) ?? 0;

            int calculatedProgress = taskCount > 0
                ? (int)Math.Round((double)completedTaskCount / taskCount * 100)
                : 0;

            bool isDelayed = p.EndDate.HasValue
                && p.EndDate.Value < DateTime.UtcNow
                && calculatedProgress < 100;

            bool allTasksSubmitted = taskCount > 0 && notFinishedCount == 0;

            string statusName;
            string statusColor;

            if (p.ProjectStatusId == STATUS_ANNULE)
            {
                statusName = "Annulé";
                statusColor = "#9E9E9E";
            }
            else if (p.ProjectStatusId == STATUS_TERMINE
                     && taskCount > 0
                     && validatedTaskCount == taskCount)
            {
                statusName = "Terminé";
                statusColor = "#00C853";
            }
            else if (taskCount > 0 && validatedTaskCount == taskCount && pendingValidationCount == 0)
            {
                statusName = "✅ Prêt à clôturer";
                statusColor = "#00BFA5";
            }
            else if (allTasksSubmitted && pendingValidationCount > 0)
            {
                statusName = "⏳ En attente de validation";
                statusColor = "#FFA500";
            }
            else if (isDelayed)
            {
                statusName = "🔴 En retard";
                statusColor = "#FF0000";
            }
            else
            {
                statusName = p.ProjectStatus?.StatusName ?? "En cours";
                statusColor = p.ProjectStatus?.Color ?? "#2196F3";
            }

            return new ProjectDTO
            {
                ProjectId = p.ProjectId,
                ProjectName = p.ProjectName ?? "Sans nom",
                Description = p.Description ?? "",
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Progress = calculatedProgress,
                TeamId = p.TeamId ?? 0,
                TeamName = p.Team?.teamName ?? "N/A",
                ProjectManagerId = p.ProjectManagerId ?? 0,
                ProjectManagerName = p.ProjectManager != null
                    ? $"{p.ProjectManager.FirstName} {p.ProjectManager.LastName}"
                    : "Non assigné",
                ProjectStatusId = p.ProjectStatusId ?? 0,
                StatusName = statusName,
                StatusColor = statusColor,
                PriorityId = p.PriorityId ?? 0,
                PriorityName = p.Priority?.Name ?? "N/A",
                TaskCount = taskCount,
                CompletedTaskCount = completedTaskCount,
                CreatedAt = p.CreatedAt,
                HasEdb = p.EDBs?.Any() ?? false
            };
        }
    }
}
