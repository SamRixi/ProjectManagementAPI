using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

namespace ProjectManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TaskController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // GET api/Task
        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            var result = await _taskService.GetAllTasksAsync();

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Task/{taskId}
        [HttpGet("{taskId}")]
        public async Task<IActionResult> GetTaskById(int taskId)
        {
            var result = await _taskService.GetTaskByIdAsync(taskId);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // POST api/Task
        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDTO dto)
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.CreateTaskAsync(dto, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // PUT api/Task/{taskId}/status/{statusId}
        [HttpPut("{taskId}/status/{statusId}")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, int statusId)
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.UpdateTaskStatusAsync(taskId, statusId, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // ✅ PUT api/Task/{taskId}/progress
        [HttpPut("{taskId}/progress")]
        public async Task<IActionResult> UpdateTaskProgress(int taskId, [FromBody] UpdateProgressDTO dto)
        {
            var userId = GetCurrentUserId();

            // méthode à avoir dans ITaskService et ProjectTaskService
            var result = await _taskService.UpdateTaskProgressAsync(taskId, dto.Progress, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // PUT api/Task/{taskId}/validate
        [HttpPut("{taskId}/validate")]
        public async Task<IActionResult> ValidateTask(int taskId)
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.ValidateTaskAsync(taskId, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Task/project/{projectId}
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetTasksByProject(int projectId)
        {
            var result = await _taskService.GetTasksByProjectAsync(projectId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Task/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetTasksByUser(int userId)
        {
            var result = await _taskService.GetTasksByUserAsync(userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Task/my-tasks
        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = GetCurrentUserId();
            var result = await _taskService.GetTasksByUserAsync(userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // DELETE api/Task/{taskId}
        [HttpDelete("{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            var result = await _taskService.DeleteTaskAsync(taskId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
