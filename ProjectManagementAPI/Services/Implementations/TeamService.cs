using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

public class TeamService : ITeamService
{
    private readonly ApplicationDbContext _context;

    public TeamService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TeamDTO>> CreateTeamAsync(CreateTeamDTO dto)
    {
        try
        {
            var team = new Team
            {
                teamName = dto.TeamName,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return new ApiResponse<TeamDTO>
            {
                Success = true,
                Message = "Équipe créée avec succès",
                Data = new TeamDTO
                {
                    TeamId = team.teamId,
                    TeamName = team.teamName,
                    Description = team.Description,
                    CreatedAt = team.CreatedAt,
                    MemberCount = 0,
                    ProjectCount = 0
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamDTO>
            {
                Success = false,
                Message = $"Erreur lors de la création de l'équipe: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<TeamDTO>> UpdateTeamAsync(UpdateTeamDTO dto)
    {
        try
        {
            var team = await _context.Teams.FindAsync(dto.TeamId);

            if (team == null)
                return new ApiResponse<TeamDTO> { Success = false, Message = "Équipe introuvable" };

            team.teamName = dto.TeamName;
            team.Description = dto.Description;
            team.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new ApiResponse<TeamDTO>
            {
                Success = true,
                Message = "Équipe mise à jour avec succès",
                Data = new TeamDTO
                {
                    TeamId = team.teamId,
                    TeamName = team.teamName,
                    Description = team.Description,
                    CreatedAt = team.CreatedAt,
                    UpdatedAt = team.UpdatedAt
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<bool>> DeleteTeamAsync(int teamId)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.TeamMembers)
                .Include(t => t.Projects)
                .FirstOrDefaultAsync(t => t.teamId == teamId);

            if (team == null)
                return new ApiResponse<bool> { Success = false, Message = "Équipe introuvable" };

            if (team.Projects != null && team.Projects.Any())
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Impossible de supprimer : cette équipe a des projets liés. Désassignez-les d'abord."
                };

            if (team.TeamMembers != null && team.TeamMembers.Any())
                _context.TeamMembers.RemoveRange(team.TeamMembers);

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Message = "Équipe supprimée avec succès", Data = true };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool> { Success = false, Message = $"Erreur lors de la suppression: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<TeamDetailsDTO>> GetTeamByIdAsync(int teamId)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.TeamMembers)
                    .ThenInclude(tm => tm.User)
                        .ThenInclude(u => u.Role)
                .Include(t => t.Projects)
                .FirstOrDefaultAsync(t => t.teamId == teamId);

            if (team == null)
                return new ApiResponse<TeamDetailsDTO> { Success = false, Message = "Équipe introuvable" };

            var teamDetails = new TeamDetailsDTO
            {
                TeamId = team.teamId,
                TeamName = team.teamName,
                Description = team.Description,
                CreatedAt = team.CreatedAt,
                UpdatedAt = team.UpdatedAt,
                Members = team.TeamMembers.Select(tm => new TeamMemberDTO
                {
                    UserId = tm.UserId,
                    UserName = tm.User.UserName,
                    FirstName = tm.User.FirstName,
                    LastName = tm.User.LastName,
                    RoleId = tm.User.RoleId,
                    RoleName = tm.User.Role.RoleName,
                    IsProjectManager = tm.IsProjectManager,
                    JoinedDate = tm.JoinedDate
                }).ToList(),
                Projects = team.Projects.Select(p => new ProjectDTO
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.ProjectName,
                    Progress = p.Progress
                }).ToList()
            };

            return new ApiResponse<TeamDetailsDTO> { Success = true, Message = "Équipe récupérée avec succès", Data = teamDetails };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamDetailsDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<List<TeamDTO>>> GetAllTeamsAsync()
    {
        try
        {
            var teams = await _context.Teams
                .Where(t => t.IsActive)
                .Include(t => t.TeamMembers)
                .Include(t => t.Projects)
                .Select(t => new TeamDTO
                {
                    TeamId = t.teamId,
                    TeamName = t.teamName,
                    Description = t.Description,
                    CreatedAt = t.CreatedAt,
                    MemberCount = t.TeamMembers.Count,
                    ProjectCount = t.Projects.Count
                })
                .ToListAsync();

            return new ApiResponse<List<TeamDTO>> { Success = true, Message = "Équipes récupérées avec succès", Data = teams };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TeamDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<TeamMemberDTO>> AddMemberAsync(AddTeamMemberDTO dto)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == dto.UserId);

            if (user == null)
                return new ApiResponse<TeamMemberDTO> { Success = false, Message = "Utilisateur introuvable" };

            // ✅ CORRECTION : Bloquer Manager et Reporting
            if (user.Role.RoleName == "Manager" || user.Role.RoleName == "Reporting")
                return new ApiResponse<TeamMemberDTO>
                {
                    Success = false,
                    Message = $"Le rôle '{user.Role.RoleName}' ne peut pas être ajouté comme membre d'équipe"
                };

            var existingMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.UserId == dto.UserId && tm.TeamId == dto.TeamId);

            if (existingMember != null)
                return new ApiResponse<TeamMemberDTO> { Success = false, Message = "Ce membre fait déjà partie de l'équipe" };

            var teamMember = new TeamMember
            {
                UserId = dto.UserId,
                TeamId = dto.TeamId,
                IsProjectManager = dto.IsProjectManager,
                JoinedDate = DateTime.UtcNow
            };

            _context.TeamMembers.Add(teamMember);

            var team = await _context.Teams.FindAsync(dto.TeamId);
            if (team != null)
                team.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var addedMember = await _context.TeamMembers
                .Include(tm => tm.User).ThenInclude(u => u.Role)
                .Include(tm => tm.Team)
                .FirstOrDefaultAsync(tm => tm.UserId == dto.UserId && tm.TeamId == dto.TeamId);

            return new ApiResponse<TeamMemberDTO>
            {
                Success = true,
                Message = "Membre ajouté avec succès",
                Data = new TeamMemberDTO
                {
                    UserId = addedMember.UserId,
                    UserName = addedMember.User.UserName,
                    FirstName = addedMember.User.FirstName,
                    LastName = addedMember.User.LastName,
                    TeamId = addedMember.TeamId,
                    TeamName = addedMember.Team.teamName,
                    RoleId = addedMember.User.RoleId,
                    RoleName = addedMember.User.Role.RoleName,
                    IsProjectManager = addedMember.IsProjectManager,
                    JoinedDate = addedMember.JoinedDate
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamMemberDTO> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<bool>> RemoveMemberAsync(int teamId, int userId)
    {
        try
        {
            var teamMember = await _context.TeamMembers
                .Include(tm => tm.Team)
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (teamMember == null)
                return new ApiResponse<bool> { Success = false, Message = "Membre introuvable" };

            teamMember.Team.UpdatedAt = DateTime.UtcNow;
            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Message = "Membre retiré avec succès", Data = true };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<bool>> ToggleTeamActiveAsync(int teamId, bool isActive)
    {
        try
        {
            var team = await _context.Teams.FindAsync(teamId);

            if (team == null)
                return new ApiResponse<bool> { Success = false, Message = "Équipe introuvable" };

            team.IsActive = isActive;
            team.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Message = isActive ? "Équipe activée" : "Équipe désactivée", Data = true };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<bool>> ToggleMemberActiveAsync(int teamId, int userId, bool isActive)
    {
        try
        {
            var teamMember = await _context.TeamMembers
                .Include(tm => tm.Team)
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (teamMember == null)
                return new ApiResponse<bool> { Success = false, Message = "Membre introuvable" };

            teamMember.IsActive = isActive;
            teamMember.Team.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Message = isActive ? "Membre activé" : "Membre désactivé", Data = true };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<List<TeamMemberDTO>>> GetTeamMembersAsync(int teamId)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.TeamMembers)
                    .ThenInclude(tm => tm.User)
                        .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(t => t.teamId == teamId);

            if (team == null)
                return new ApiResponse<List<TeamMemberDTO>> { Success = false, Message = "Équipe introuvable" };

            var members = team.TeamMembers
                .Select(tm => new TeamMemberDTO
                {
                    TeamId = tm.TeamId,
                    TeamName = team.teamName,
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

            return new ApiResponse<List<TeamMemberDTO>> { Success = true, Message = $"{members.Count} membre(s) trouvé(s)", Data = members };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TeamMemberDTO>> { Success = false, Message = $"Erreur: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<List<ProjectManagerDTO>>> GetProjectManagersAsync()
    {
        try
        {
            var projectManagers = await _context.TeamMembers
                .Where(tm => tm.IsProjectManager && tm.IsActive)
                .Include(tm => tm.User)
                .Include(tm => tm.Team)
                .Select(tm => new ProjectManagerDTO
                {
                    UserId = tm.User.UserId,
                    FirstName = tm.User.FirstName,
                    LastName = tm.User.LastName,
                    Email = tm.User.Email,
                    teamId = tm.Team.teamId,
                    teamName = tm.Team.teamName
                })
                .Distinct()
                .ToListAsync();

            return new ApiResponse<List<ProjectManagerDTO>> { Success = true, Data = projectManagers, Message = $"{projectManagers.Count} chef(s) de projet disponible(s)" };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProjectManagerDTO>> { Success = false, Message = "Erreur lors de la récupération des chefs de projet" };
        }
    }

    public async Task<ApiResponse<bool>> SetProjectManagerAsync(int teamId, int userId, bool isProjectManager)
    {
        try
        {
            var teamMember = await _context.TeamMembers
                .Include(tm => tm.User)
                .Include(tm => tm.Team)
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (teamMember == null)
                return new ApiResponse<bool> { Success = false, Message = "Membre d'équipe introuvable" };

            teamMember.IsProjectManager = isProjectManager;
            teamMember.Team.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var message = isProjectManager
                ? $"{teamMember.User.FirstName} {teamMember.User.LastName} est maintenant chef de projet"
                : $"{teamMember.User.FirstName} {teamMember.User.LastName} n'est plus chef de projet";

            return new ApiResponse<bool> { Success = true, Message = message, Data = true };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool> { Success = false, Message = "Erreur lors de la mise à jour du statut chef de projet" };
        }
    }

    // ✅ NOUVEAU : Récupérer les users disponibles pour le dropdown (Developer + ProjectManager uniquement)
    public async Task<ApiResponse<List<TeamMemberDTO>>> GetAvailableUsersForTeamAsync(int teamId)
    {
        try
        {
            // Users déjà dans l'équipe
            var existingIds = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamId)
                .Select(tm => tm.UserId)
                .ToListAsync();

            // ✅ Seulement Developer + ProjectManager, pas déjà membres
            var users = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.IsActive &&
                            (u.Role.RoleName == "Developer" || u.Role.RoleName == "Project Manager") &&
                            !existingIds.Contains(u.UserId))
                .Select(u => new TeamMemberDTO
                {
                    UserId = u.UserId,
                    UserName = u.UserName,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email,
                    RoleId = u.RoleId,
                    RoleName = u.Role.RoleName,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            return new ApiResponse<List<TeamMemberDTO>>
            {
                Success = true,
                Data = users,
                Message = $"{users.Count} utilisateur(s) disponible(s)"
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TeamMemberDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }
}