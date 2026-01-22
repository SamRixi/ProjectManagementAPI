using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EdbController : ControllerBase
{
    private readonly IEdbService _edbService;

    public EdbController(IEdbService edbService)
    {
        _edbService = edbService;
    }

    // ============= Upload EDB (Reporting) =============

    [HttpPost("upload")]
    [Authorize(Roles = "Reporting")]
    public async Task<IActionResult> UploadEdb([FromForm] IFormFile file, [FromForm] string? description)
    {
        var result = await _edbService.UploadEdbAsync(file, description);
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
        {
            return NotFound(result);
        }

        var filePath = result.Data.FileUrl;

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Fichier introuvable" });
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(fileBytes, "application/octet-stream", result.Data.FileName);
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
