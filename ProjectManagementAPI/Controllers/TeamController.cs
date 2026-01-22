using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;

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

    // ============= CRUD Teams (Reporting) =============

    [HttpPost]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDTO dto)
    {
        var result = await _teamService.CreateTeamAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{teamId}")]
    [Authorize(Roles = "Reporting")]
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

    // ============= Toggle Team Active (Reporting) =============

    [HttpPut("{teamId}/toggle-active")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> ToggleTeamActive(int teamId, [FromBody] bool isActive)
    {
        var result = await _teamService.ToggleTeamActiveAsync(teamId, isActive);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Team Members (Reporting) =============

    [HttpPost("member")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> AddMember([FromBody] AddTeamMemberDTO dto)
    {
        var result = await _teamService.AddMemberAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("member/{memberId}/toggle-active")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> ToggleMemberActive(int memberId, [FromBody] bool isActive)
    {
        var result = await _teamService.ToggleMemberActiveAsync(memberId, isActive);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}