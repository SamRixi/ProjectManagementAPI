using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EdbController : ControllerBase
{
    private readonly IEdbService _edbService;
    private readonly IWebHostEnvironment _environment;

    public EdbController(IEdbService edbService, IWebHostEnvironment environment)
    {
        _edbService = edbService;
        _environment = environment;
    }

    // ============= Upload EDB (Reporting) =============
    // file + projectId + description envoyés en FormData
    [HttpPost("upload")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> UploadEdb(
        [FromForm] IFormFile file,
        [FromForm] int projectId,
        [FromForm] string? description)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "Aucun fichier fourni" });

        if (projectId <= 0)
            return BadRequest(new { success = false, message = "projectId est obligatoire" });

        var result = await _edbService.UploadEdbAsync(file, projectId, description);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= EDB de MES projets (Chef de projet / Dev, etc.) =============
    [HttpGet("my-project-edbs")]
    public async Task<IActionResult> GetMyProjectEdbs()
    {
        var result = await _edbService.GetMyProjectEdbsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= List & Get EDBs =============

    [HttpGet]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> GetAllEdbs()
    {
        var result = await _edbService.GetAllEdbsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{edbId}")]
    public async Task<IActionResult> GetEdbById(int edbId)
    {
        var result = await _edbService.GetEdbByIdAsync(edbId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetProjectEdbs(int projectId)
    {
        var result = await _edbService.GetProjectEdbsAsync(projectId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ============= Download EDB =============
    [HttpGet("{edbId}/download")]
    public async Task<IActionResult> DownloadEdb(int edbId)
    {
        var result = await _edbService.GetEdbByIdAsync(edbId);

        if (!result.Success || result.Data == null)
            return NotFound(result);

        var uri = new Uri(result.Data.FileUrl);
        var fileName = Path.GetFileName(uri.LocalPath);

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "EDBs");
        var filePath = Path.Combine(uploadsFolder, fileName);

        if (!System.IO.File.Exists(filePath))
            return NotFound(new { message = "Fichier introuvable" });

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(fileBytes, "application/octet-stream", fileName);
    }

    // ============= Delete EDB (Reporting) =============
    [HttpDelete("{edbId}")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> DeleteEdb(int edbId)
    {
        var result = await _edbService.DeleteEdbAsync(edbId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
