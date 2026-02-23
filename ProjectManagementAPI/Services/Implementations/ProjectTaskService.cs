using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Services.Implementations
{
    public class ProjectTaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public ProjectTaskService(
            ApplicationDbContext context,
            INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // ============= GET ALL TASKS =============
        public async Task<ApiResponse<List<TaskDTO>>> GetAllTasksAsync()
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .ToListAsync();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = tasks.Select(t => MapToDto(t)).ToList(),
                    Message = "Tâches récupérées avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<TaskDTO>>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= GET TASK BY ID =============
        public async Task<ApiResponse<TaskDTO>> GetTaskByIdAsync(int taskId)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche non trouvée" };

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(task),
                    Message = "Tâche récupérée avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= CREATE TASK ============= ✅ + Notification
        public async Task<ApiResponse<TaskDTO>> CreateTaskAsync(CreateTaskDTO dto, int createdByUserId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(dto.ProjectId);
                if (project == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Projet non trouvé" };

                if (dto.AssignedToUserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(dto.AssignedToUserId.Value);
                    if (user == null)
                        return new ApiResponse<TaskDTO>
                        { Success = false, Message = "Utilisateur assigné non trouvé" };
                }

                var task = new ProjectTask
                {
                    TaskName = dto.TaskName,
                    Description = dto.Description,
                    DueDate = dto.DueDate,
                    Progress = 0,
                    IsValidated = false,
                    ProjectId = dto.ProjectId,
                    TaskStatusId = 1, // À faire
                    PriorityId = dto.PriorityId,
                    AssignedToUserId = dto.AssignedToUserId,
                    CreatedByUserId = createdByUserId,
                };

                _context.ProjectTasks.Add(task);

                if (project.ProjectStatusId == 1)
                    project.ProjectStatusId = 2;

                await _context.SaveChangesAsync();

                // ✅ Notification — Tâche assignée au développeur
                if (dto.AssignedToUserId.HasValue)
                {
                    var chef = await _context.Users.FindAsync(createdByUserId);
                    var chefNom = chef != null
                        ? $"{chef.FirstName} {chef.LastName}"
                        : "Chef de Projet";

                    await _notificationService.CreateNotificationAsync(
                        userId: dto.AssignedToUserId.Value,
                        title: "📋 Nouvelle tâche assignée",
                        message: $"Vous avez une nouvelle tâche assignée par {chefNom} : \"{dto.TaskName}\"",
                        type: "TASK_ASSIGNED",
                        relatedTaskId: task.ProjectTaskId
                    );
                }

                var createdTask = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == task.ProjectTaskId);

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(createdTask),
                    Message = "Tâche créée avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= UPDATE PROGRESS =============
        public async Task<ApiResponse<TaskDTO>> UpdateTaskProgressAsync(int taskId, int progress, int userId)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche non trouvée" };

                if (task.AssignedToUserId != userId)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Vous ne pouvez modifier que vos propres tâches" };

                if (progress < 0 || progress > 100)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "La progression doit être entre 0 et 100" };

                if (task.IsValidated)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche déjà validée, modification impossible" };

                task.Progress = progress;
                task.TaskStatusId = progress switch
                {
                    0 => 1, // À faire
                    100 => 4, // En attente de validation
                    _ => 2  // En cours
                };

                if (progress < 100)
                    task.IsValidated = false;

                await _context.SaveChangesAsync();
                await RecalculateProjectProgressAsync(task.ProjectId);

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(task),
                    Message = $"Progression mise à jour : {progress}%"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= UPDATE STATUS =============
        public async Task<ApiResponse<TaskDTO>> UpdateTaskStatusAsync(int taskId, int statusId, int userId)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche non trouvée" };

                if (task.AssignedToUserId != userId)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Vous ne pouvez modifier que vos propres tâches" };

                task.TaskStatusId = statusId;

                if (statusId == 3)
                {
                    task.Progress = 100;
                    task.TaskStatusId = 4;
                    task.IsValidated = false;
                }

                await _context.SaveChangesAsync();
                await RecalculateProjectProgressAsync(task.ProjectId);

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(task),
                    Message = "Statut mis à jour avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= VALIDATE TASK ============= ✅ + Notification
        public async Task<ApiResponse<TaskDTO>> ValidateTaskAsync(int taskId, int userId)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche non trouvée" };

                if (task.Project.ProjectManagerId != userId)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Seul le Chef de Projet peut valider une tâche" };

                if (task.TaskStatusId != 4)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "La tâche doit être en attente de validation" };

                task.IsValidated = true;
                task.TaskStatusId = 5; // Validé
                task.ValidatedByUserId = userId;
                task.ValidatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await RecalculateProjectProgressAsync(task.ProjectId);

                // ✅ Notification — Tâche validée
                if (task.AssignedToUserId.HasValue)
                {
                    var chef = await _context.Users.FindAsync(userId);
                    var chefNom = chef != null
                        ? $"{chef.FirstName} {chef.LastName}"
                        : "Chef de Projet";

                    await _notificationService.CreateNotificationAsync(
                        userId: task.AssignedToUserId.Value,
                        title: "✅ Tâche validée",
                        message: $"Votre tâche \"{task.TaskName}\" a été validée par {chefNom}",
                        type: "TASK_VALIDATED",
                        relatedTaskId: task.ProjectTaskId
                    );
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(task),
                    Message = "Tâche validée avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= REJECT TASK ============= ✅ + Notification
        public async Task<ApiResponse<TaskDTO>> RejectTaskAsync(int taskId, int userId, string? reason)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.Project)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .FirstOrDefaultAsync(t => t.ProjectTaskId == taskId);

                if (task == null)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche non trouvée" };

                if (task.Project.ProjectManagerId != userId)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Seul le Chef de Projet peut rejeter une tâche" };

                if (task.TaskStatusId != 4)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "La tâche doit être en attente de validation" };

                // ✅ Reset → En cours pour que le dev puisse retravailler
                task.IsValidated = false;
                task.TaskStatusId = 2; // En cours
                task.Progress = 0;
                task.RejectionReason = reason;

                await _context.SaveChangesAsync();
                await RecalculateProjectProgressAsync(task.ProjectId);

                // ✅ Notification — Tâche rejetée + cause
                if (task.AssignedToUserId.HasValue)
                {
                    var chef = await _context.Users.FindAsync(userId);
                    var chefNom = chef != null
                        ? $"{chef.FirstName} {chef.LastName}"
                        : "Chef de Projet";

                    var message = string.IsNullOrEmpty(reason)
                        ? $"Votre tâche \"{task.TaskName}\" a été rejetée par {chefNom}"
                        : $"Votre tâche \"{task.TaskName}\" a été rejetée par {chefNom}. Cause : {reason}";

                    await _notificationService.CreateNotificationAsync(
                        userId: task.AssignedToUserId.Value,
                        title: "❌ Tâche rejetée",
                        message: message,
                        type: "TASK_REJECTED",
                        relatedTaskId: task.ProjectTaskId
                    );
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDto(task),
                    Message = "Tâche rejetée avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<TaskDTO>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= GET BY PROJECT =============
        public async Task<ApiResponse<List<TaskDTO>>> GetTasksByProjectAsync(int projectId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.ProjectId == projectId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.AssignedToUser)
                    .ToListAsync();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = tasks.Select(t => MapToDto(t)).ToList(),
                    Message = "Tâches du projet récupérées avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<TaskDTO>>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= GET BY USER =============
        public async Task<ApiResponse<List<TaskDTO>>> GetTasksByUserAsync(int userId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(t => t.AssignedToUserId == userId)
                    .Include(t => t.ProjectTasksStatus)
                    .Include(t => t.Priority)
                    .Include(t => t.Project)
                    .ToListAsync();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = tasks.Select(t => MapToDto(t)).ToList(),
                    Message = "Tâches de l'utilisateur récupérées avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<TaskDTO>>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= DELETE TASK =============
        public async Task<ApiResponse<bool>> DeleteTaskAsync(int taskId)
        {
            try
            {
                var task = await _context.ProjectTasks.FindAsync(taskId);
                if (task == null)
                    return new ApiResponse<bool>
                    { Success = false, Message = "Tâche non trouvée" };

                _context.ProjectTasks.Remove(task);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Tâche supprimée avec succès"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                { Success = false, Message = $"Erreur : {ex.Message}" };
            }
        }

        // ============= RECALCUL PROGRESSION =============
        private async Task RecalculateProjectProgressAsync(int projectId)
        {
            var tasks = await _context.ProjectTasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return;

            if (project.ProjectStatusId == 3 || project.ProjectStatusId == 4)
                return;

            if (tasks.Count == 0)
            {
                project.Progress = 0;
                project.ProjectStatusId = 1;
            }
            else
            {
                project.Progress = (int)Math.Round(
                    tasks.Average(t => (double)t.Progress)
                );
                project.ProjectStatusId = project.Progress == 0 ? 1 : 2;
            }

            await _context.SaveChangesAsync();
        }

        // ============= MAP TO DTO =============
        private TaskDTO MapToDto(ProjectTask task)
        {
            return new TaskDTO
            {
                TaskId = task.ProjectTaskId,
                TaskName = task.TaskName,
                Description = task.Description,
                DueDate = task.DueDate,
                Progress = task.Progress,
                IsValidated = task.IsValidated,
                ProjectId = task.ProjectId,
                ProjectName = task.Project?.ProjectName ?? "",
                StatusName = task.ProjectTasksStatus?.StatusName ?? "",
                StatusColor = task.ProjectTasksStatus?.Color ?? "",
                PriorityName = task.Priority?.Name ?? "",
                AssignedToUserName = task.AssignedToUser != null
                    ? $"{task.AssignedToUser.FirstName} {task.AssignedToUser.LastName}"
                    : null,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
