using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Controllers
{
    /// <summary>
    /// ProjectController - Gère les projets et leurs équipes
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ITeamService _teamService;

        public ProjectController(IProjectService projectService, ITeamService teamService)
        {
            _projectService = projectService;
            _teamService = teamService;
        }

        // ============= CREATE PROJECTS (Reporting/Manager) =============

        [HttpPost]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            try
            {
                var result = await _projectService.CreateProjectAsync(dto);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la création du projet",
                    error = ex.Message
                });
            }
        }

        [HttpPost("with-edb")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateProjectWithEdb([FromBody] CreateProjectWithEdbDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            try
            {
                var result = await _projectService.CreateProjectWithEdbAsync(dto);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la création du projet avec EDB",
                    error = ex.Message
                });
            }
        }

        // ============= UPDATE PROJECT (Reporting/Manager) =============

        [HttpPut("{projectId}")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProject(int projectId, [FromBody] UpdateProjectDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            try
            {
                dto.ProjectId = projectId;
                var result = await _projectService.UpdateProjectAsync(dto);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la mise à jour du projet",
                    error = ex.Message
                });
            }
        }

        // ============= ASSIGN EDB TO PROJECT (Reporting/Manager) =============

        [HttpPut("{projectId}/assign-edb")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AssignEdbToProject(int projectId, [FromBody] int edbId)
        {
            if (edbId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "ID EDB invalide"
                });
            }

            try
            {
                var result = await _projectService.AssignEdbToProjectAsync(projectId, edbId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'assignation de l'EDB",
                    error = ex.Message
                });
            }
        }

        // ============= ASSIGN TEAM (Reporting/Manager) =============

        [HttpPut("{projectId}/assign-team")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AssignTeamToProject(int projectId, [FromBody] int teamId)
        {
            if (teamId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "ID d'équipe invalide"
                });
            }

            try
            {
                var result = await _projectService.AssignTeamToProjectAsync(projectId, teamId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'assignation de l'équipe",
                    error = ex.Message
                });
            }
        }

        // ============= ASSIGN PROJECT MANAGER =============

        [HttpPut("{projectId}/assign-manager")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignProjectManager(int projectId, [FromBody] AssignProjectManagerDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides"
                });
            }

            try
            {
                var result = await _projectService.AssignProjectManagerAsync(projectId, dto.UserId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'assignation du chef de projet",
                    error = ex.Message
                });
            }
        }

        // ============= SET PROJECT MANAGER STATUS =============

        [HttpPut("set-project-manager")]
        [Authorize(Roles = "Reporting,Manager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SetProjectManager([FromBody] SetProjectManagerDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Données invalides"
                });
            }

            try
            {
                var result = await _teamService.SetProjectManagerAsync(dto.TeamId, dto.UserId, dto.IsProjectManager);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la mise à jour du chef de projet",
                    error = ex.Message
                });
            }
        }

        // ============= GET PROJECTS =============

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllProjects()
        {
            try
            {
                var result = await _projectService.GetAllProjectsAsync();
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{projectId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProjectById(int projectId)
        {
            try
            {
                var result = await _projectService.GetProjectByIdAsync(projectId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération du projet",
                    error = ex.Message
                });
            }
        }

        [HttpGet("team/{teamId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTeamProjects(int teamId)
        {
            try
            {
                var result = await _projectService.GetTeamProjectsAsync(teamId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets de l'équipe",
                    error = ex.Message
                });
            }
        }

        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserProjects(int userId)
        {
            try
            {
                var result = await _projectService.GetUserProjectsAsync(userId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets de l'utilisateur",
                    error = ex.Message
                });
            }
        }

        [HttpGet("managed-by/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetManagedProjects(int userId)
        {
            try
            {
                var result = await _projectService.GetManagedProjectsAsync(userId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des projets managés",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{projectId}/team-members")]
        [Authorize(Roles = "Reporting,Manager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProjectTeamMembers(int projectId, [FromQuery] string? search)
        {
            try
            {
                var result = await _projectService.GetProjectTeamMembersAsync(projectId, search);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la récupération des membres de l'équipe",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{projectId}/stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProjectStats(int projectId)
        {
            try
            {
                var result = await _projectService.GetProjectStatsAsync(projectId);
                return result.Success ? Ok(result) : BadRequest(result);
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

        // ============= CANCEL PROJECT =============

        [HttpPut("{projectId}/cancel")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelProject(int projectId)
        {
            try
            {
                var result = await _projectService.CancelProjectAsync(projectId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de l'annulation du projet",
                    error = ex.Message
                });
            }
        }
    }
}
