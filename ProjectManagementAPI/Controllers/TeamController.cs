using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        // ============= CRUD Teams (Reporting/Manager) =============

        [HttpPost]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDTO dto)
        {
            var result = await _teamService.CreateTeamAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{teamId}")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> UpdateTeam(int teamId, [FromBody] UpdateTeamDTO dto)
        {
            dto.TeamId = teamId;
            var result = await _teamService.UpdateTeamAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTeams()
        {
            var result = await _teamService.GetAllTeamsAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{teamId}")]
        public async Task<IActionResult> GetTeamById(int teamId)
        {
            var result = await _teamService.GetTeamByIdAsync(teamId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        // ============= Toggle Team Active (Reporting/Manager) =============

        [HttpPut("{teamId}/toggle-active")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> ToggleTeamActive(int teamId, [FromBody] bool isActive)
        {
            var result = await _teamService.ToggleTeamActiveAsync(teamId, isActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Team Members (Reporting/Manager) =============

        [HttpPost("member")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> AddMember([FromBody] AddTeamMemberDTO dto)
        {
            var result = await _teamService.AddMemberAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("member/{memberId}/toggle-active")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> ToggleMemberActive(int memberId, [FromBody] bool isActive)
        {
            var result = await _teamService.ToggleMemberActiveAsync(memberId, isActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ✅ NOUVEAU : Définir un membre comme chef de projet
        [HttpPut("member/{teamMemberId}/set-project-manager")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> SetProjectManager(int teamMemberId, [FromBody] SetProjectManagerDTO dto)
        {
            var result = await _teamService.SetProjectManagerAsync(teamMemberId, dto.IsProjectManager);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Get Team Members (All) =============

        [HttpGet("{teamId}/members")]
        public async Task<IActionResult> GetTeamMembers(int teamId)
        {
            var result = await _teamService.GetTeamMembersAsync(teamId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ✅ NOUVEAU : Récupérer tous les chefs de projet (pour dropdown)
        [HttpGet("project-managers")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> GetProjectManagers()
        {
            var result = await _teamService.GetProjectManagersAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Remove Team Member (Reporting/Manager) =============

        [HttpDelete("member/{teamId}/{userId}")]
        [Authorize(Roles = "Reporting,Manager")]
        public async Task<IActionResult> RemoveMember(int teamId, int userId)
        {
            var result = await _teamService.RemoveMemberAsync(teamId, userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
