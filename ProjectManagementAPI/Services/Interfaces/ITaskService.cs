using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface ITaskService
    {
        // GET
        Task<ApiResponse<List<TaskDTO>>> GetAllTasksAsync();
        Task<ApiResponse<TaskDTO>> GetTaskByIdAsync(int taskId);
        Task<ApiResponse<List<TaskDTO>>> GetTasksByProjectAsync(int projectId);
        Task<ApiResponse<List<TaskDTO>>> GetTasksByUserAsync(int userId);

        // CREATE
        Task<ApiResponse<TaskDTO>> CreateTaskAsync(CreateTaskDTO dto, int createdByUserId);

        // UPDATE
        Task<ApiResponse<TaskDTO>> UpdateTaskStatusAsync(int taskId, int statusId, int userId);

        // VALIDATE
        Task<ApiResponse<TaskDTO>> ValidateTaskAsync(int taskId, int userId);

        // DELETE
        Task<ApiResponse<bool>> DeleteTaskAsync(int taskId);
    }
}
