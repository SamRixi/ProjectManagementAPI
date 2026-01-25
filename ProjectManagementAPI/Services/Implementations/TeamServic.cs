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
            {
                return new ApiResponse<TeamDTO>
                {
                    Success = false,
                    Message = "Équipe introuvable"
                };
            }

            team.teamName = dto.TeamName;
            await _context.SaveChangesAsync();

            return new ApiResponse<TeamDTO>
            {
                Success = true,
                Message = "Équipe mise à jour avec succès",
                Data = new TeamDTO
                {
                    TeamId = team.teamId,
                    TeamName = team.teamName,
                    CreatedAt = team.CreatedAt
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<bool>> DeleteTeamAsync(int teamId)
    {
        try
        {
            var team = await _context.Teams.FindAsync(teamId);

            if (team == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Équipe introuvable"
                };
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Équipe supprimée avec succès",
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

    public async Task<ApiResponse<TeamDetailsDTO>> GetTeamByIdAsync(int teamId)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.TeamMembers)
                    .ThenInclude(tm => tm.User)
                        .ThenInclude(u => u.Role) // ✅ FIXED: Include Role from User
                .Include(t => t.Projects)
                .FirstOrDefaultAsync(t => t.teamId == teamId);

            if (team == null)
            {
                return new ApiResponse<TeamDetailsDTO>
                {
                    Success = false,
                    Message = "Équipe introuvable"
                };
            }

            var teamDetails = new TeamDetailsDTO
            {
                TeamId = team.teamId,
                TeamName = team.teamName,
                CreatedAt = team.CreatedAt,
                Members = team.TeamMembers.Select(tm => new TeamMemberDTO
                {
                    TeamMemberId = tm.TeamMemberId,
                    UserId = tm.UserId,
                    UserName = tm.User.UserName,
                    FirstName = tm.User.FirstName,
                    LastName = tm.User.LastName,
                    RoleId = tm.User.RoleId, // ✅ FIXED: Get from User, not TeamMember
                    RoleName = tm.User.Role.RoleName, // ✅ FIXED: Get from User, not TeamMember
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

            return new ApiResponse<TeamDetailsDTO>
            {
                Success = true,
                Message = "Équipe récupérée avec succès",
                Data = teamDetails
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamDetailsDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<List<TeamDTO>>> GetAllTeamsAsync()
    {
        try
        {
            var teams = await _context.Teams
                .Include(t => t.TeamMembers)
                .Include(t => t.Projects)
                .Select(t => new TeamDTO
                {
                    TeamId = t.teamId,
                    TeamName = t.teamName,
                    CreatedAt = t.CreatedAt,
                    MemberCount = t.TeamMembers.Count,
                    ProjectCount = t.Projects.Count
                })
                .ToListAsync();

            return new ApiResponse<List<TeamDTO>>
            {
                Success = true,
                Message = "Équipes récupérées avec succès",
                Data = teams
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TeamDTO>>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<TeamMemberDTO>> AddMemberAsync(AddTeamMemberDTO dto)
    {
        try
        {
            // Vérifier si l'utilisateur existe
            var user = await _context.Users
                .Include(u => u.Role) // ✅ FIXED: Include Role
                .FirstOrDefaultAsync(u => u.UserId == dto.UserId);

            if (user == null)
            {
                return new ApiResponse<TeamMemberDTO>
                {
                    Success = false,
                    Message = "Utilisateur introuvable"
                };
            }

            // Vérifier si le membre existe déjà dans l'équipe
            var existingMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.UserId == dto.UserId && tm.TeamId == dto.TeamId);

            if (existingMember != null)
            {
                return new ApiResponse<TeamMemberDTO>
                {
                    Success = false,
                    Message = "Ce membre fait déjà partie de l'équipe"
                };
            }

            var teamMember = new TeamMember
            {
                UserId = dto.UserId,
                TeamId = dto.TeamId,
                // ❌ REMOVED: RoleId = dto.RoleId, (TeamMember doesn't have RoleId)
                IsProjectManager = dto.IsProjectManager,
                JoinedDate = DateTime.UtcNow
            };

            _context.TeamMembers.Add(teamMember);
            await _context.SaveChangesAsync();

            // Recharger avec les relations
            var addedMember = await _context.TeamMembers
                .Include(tm => tm.User)
                    .ThenInclude(u => u.Role) // ✅ FIXED: Include Role from User
                .Include(tm => tm.Team)
                .FirstOrDefaultAsync(tm => tm.TeamMemberId == teamMember.TeamMemberId);

            return new ApiResponse<TeamMemberDTO>
            {
                Success = true,
                Message = "Membre ajouté avec succès",
                Data = new TeamMemberDTO
                {
                    TeamMemberId = addedMember.TeamMemberId,
                    UserId = addedMember.UserId,
                    UserName = addedMember.User.UserName,
                    FirstName = addedMember.User.FirstName,
                    LastName = addedMember.User.LastName,
                    TeamId = addedMember.TeamId,
                    TeamName = addedMember.Team.teamName,
                    RoleId = addedMember.User.RoleId, // ✅ FIXED: Get from User
                    RoleName = addedMember.User.Role.RoleName, // ✅ FIXED: Get from User
                    IsProjectManager = addedMember.IsProjectManager,
                    JoinedDate = addedMember.JoinedDate
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TeamMemberDTO>
            {
                Success = false,
                Message = $"Erreur: {ex.Message}"
            };
        }
    }

    public async Task<ApiResponse<bool>> RemoveMemberAsync(int teamMemberId)
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

            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Membre retiré avec succès",
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

    public Task<ApiResponse<bool>> ToggleTeamActiveAsync(int teamId, bool isActive)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> ToggleMemberActiveAsync(int memberId, bool isActive)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<TeamMemberDTO>>> GetTeamMembersAsync(int teamId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> RemoveMemberAsync(int teamId, int userId)
    {
        throw new NotImplementedException();
    }
}

