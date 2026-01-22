using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // ============= Create Projects (Reporting) =============

    [HttpPost]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDTO dto)
    {
        var result = await _projectService.CreateProjectAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("with-edb")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> CreateProjectWithEdb([FromBody] CreateProjectWithEdbDTO dto)
    {
        var result = await _projectService.CreateProjectWithEdbAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Update Project (Reporting) =============

    [HttpPut("{projectId}")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> UpdateProject(int projectId, [FromBody] UpdateProjectDTO dto)
    {
        dto.ProjectId = projectId;
        var result = await _projectService.UpdateProjectAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Assign Team (Reporting) =============

    [HttpPut("{projectId}/assign-team")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> AssignTeamToProject(int projectId, [FromBody] int teamId)
    {
        var result = await _projectService.AssignTeamToProjectAsync(projectId, teamId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Set Project Manager (Reporting) =============

    [HttpPut("set-project-manager")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> SetProjectManager([FromBody] SetProjectManagerDTO dto)
    {
        var result = await _projectService.SetProjectManagerAsync(dto.TeamMemberId, dto.IsProjectManager);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Get Projects (All roles) =============

    [HttpGet]
    public async Task<IActionResult> GetAllProjects()
    {
        var result = await _projectService.GetAllProjectsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetProjectById(int projectId)
    {
        var result = await _projectService.GetProjectByIdAsync(projectId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetTeamProjects(int teamId)
    {
        var result = await _projectService.GetTeamProjectsAsync(teamId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserProjects(int userId)
    {
        var result = await _projectService.GetUserProjectsAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Get Team Members for Project (Reporting) =============

    [HttpGet("{projectId}/team-members")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> GetProjectTeamMembers(int projectId, [FromQuery] string? search)
    {
        var result = await _projectService.GetProjectTeamMembersAsync(projectId, search);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Project Stats =============

    [HttpGet("{projectId}/stats")]
    public async Task<IActionResult> GetProjectStats(int projectId)
    {
        var result = await _projectService.GetProjectStatsAsync(projectId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}


