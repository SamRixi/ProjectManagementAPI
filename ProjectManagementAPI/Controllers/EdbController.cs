using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.Services.Interfaces;
using System;

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
        // ✅ Extract filename from URL
        var uri = new Uri(result.Data.FileUrl);
        var fileName = Path.GetFileName(uri.LocalPath);

        // ✅ Build physical file path
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "EDBs");
        var filePath = Path.Combine(uploadsFolder, fileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Fichier introuvable" });
        }

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
