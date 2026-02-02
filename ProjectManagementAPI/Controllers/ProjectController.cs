using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

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

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        // ============= CREATE PROJECTS (Reporting/Manager) =============

        /// <summary>
        /// Crée un nouveau projet
        /// </summary>
        /// <param name="dto">Données du projet</param>
        /// <returns>Projet créé</returns>
        /// <response code="200">Projet créé avec succès</response>
        /// <response code="400">Données invalides</response>
        /// <response code="403">Rôle insuffisant</response>
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

        /// <summary>
        /// Crée un projet à partir d'un EDB existant
        /// </summary>
        /// <param name="dto">Données du projet avec ID de l'EDB</param>
        /// <returns>Projet créé avec EDB lié</returns>
        /// <response code="200">Projet créé avec succès</response>
        /// <response code="400">EDB non trouvé ou données invalides</response>
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

        /// <summary>
        /// Met à jour un projet existant
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <param name="dto">Nouvelles données du projet</param>
        /// <returns>Projet mis à jour</returns>
        /// <response code="200">Projet mis à jour avec succès</response>
        /// <response code="400">Données invalides</response>
        /// <response code="404">Projet non trouvé</response>
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

        // ============= ASSIGN TEAM (Reporting/Manager) =============

        /// <summary>
        /// Assigne une équipe à un projet
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <param name="teamId">ID de l'équipe à assigner</param>
        /// <returns>Confirmation d'assignation</returns>
        /// <response code="200">Équipe assignée avec succès</response>
        /// <response code="400">Projet ou équipe non trouvé</response>
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

        // ⭐ ============= ASSIGN PROJECT MANAGER (NEW) =============

        /// <summary>
        /// Assigne un chef de projet à un projet spécifique
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <param name="dto">ID du user à assigner comme chef</param>
        /// <returns>Confirmation d'assignation</returns>
        /// <response code="200">Chef de projet assigné avec succès</response>
        /// <response code="400">User ou projet non trouvé</response>
        /// <response code="404">Projet non trouvé</response>
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

        // ============= SET PROJECT MANAGER STATUS (Reporting/Manager) =============

        /// <summary>
        /// Définit ou retire le rôle de chef de projet d'un membre d'équipe
        /// </summary>
        /// <param name="dto">ID du membre et statut de chef de projet</param>
        /// <returns>Confirmation de mise à jour</returns>
        /// <response code="200">Statut mis à jour avec succès</response>
        /// <response code="400">Membre non trouvé</response>
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
                var result = await _projectService.SetProjectManagerAsync(dto.TeamMemberId, dto.IsProjectManager);
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

        // ============= GET PROJECTS (All authenticated users) =============

        /// <summary>
        /// Récupère tous les projets
        /// </summary>
        /// <returns>Liste de tous les projets</returns>
        /// <response code="200">Liste récupérée avec succès</response>
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

        /// <summary>
        /// Récupère un projet par son ID
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <returns>Détails du projet</returns>
        /// <response code="200">Projet trouvé</response>
        /// <response code="404">Projet non trouvé</response>
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

        /// <summary>
        /// Récupère tous les projets d'une équipe
        /// </summary>
        /// <param name="teamId">ID de l'équipe</param>
        /// <returns>Liste des projets de l'équipe</returns>
        /// <response code="200">Liste récupérée avec succès</response>
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

        /// <summary>
        /// Récupère tous les projets d'un utilisateur
        /// </summary>
        /// <param name="userId">ID de l'utilisateur</param>
        /// <returns>Liste des projets de l'utilisateur</returns>
        /// <response code="200">Liste récupérée avec succès</response>
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

        // ⭐ ============= GET MANAGED PROJECTS (NEW) =============

        /// <summary>
        /// Récupère tous les projets managés par un chef de projet
        /// </summary>
        /// <param name="userId">ID du chef de projet</param>
        /// <returns>Liste des projets managés</returns>
        /// <response code="200">Liste récupérée avec succès</response>
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

        // ============= GET TEAM MEMBERS FOR PROJECT =============

        /// <summary>
        /// Récupère les membres de l'équipe d'un projet
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <param name="search">Terme de recherche optionnel</param>
        /// <returns>Liste des membres de l'équipe</returns>
        /// <response code="200">Liste récupérée avec succès</response>
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

        // ============= PROJECT STATS =============

        /// <summary>
        /// Récupère les statistiques d'un projet (progression, tâches, etc.)
        /// </summary>
        /// <param name="projectId">ID du projet</param>
        /// <returns>Statistiques du projet</returns>
        /// <response code="200">Statistiques récupérées</response>
        /// <response code="404">Projet non trouvé</response>
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

        // ============= DELETE PROJECT (Manager/Reporting only) =============

        /// <summary>
        /// Supprime un projet
        /// </summary>
        /// <param name="projectId">ID du projet à supprimer</param>
        /// <returns>Confirmation de suppression</returns>
        /// <response code="200">Projet supprimé avec succès</response>
        /// <response code="404">Projet non trouvé</response>
        [HttpDelete("{projectId}")]
        [Authorize(Roles = "Manager,Reporting")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteProject(int projectId)
        {
            try
            {
                var result = await _projectService.DeleteProjectAsync(projectId);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erreur lors de la suppression du projet",
                    error = ex.Message
                });
            }
        }
    }
}

