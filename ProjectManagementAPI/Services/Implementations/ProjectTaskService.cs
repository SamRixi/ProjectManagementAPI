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

        public ProjectTaskService(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET all tasks
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
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        // GET task by ID
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

        // CREATE task
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

                // Si projet "Planifié" → passe en "En cours"
                if (project.ProjectStatusId == 1)
                    project.ProjectStatusId = 2;

                await _context.SaveChangesAsync();

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

        // UPDATE task progress (Développeur)
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

                // Seulement le dev assigné peut modifier
                if (task.AssignedToUserId != userId)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Vous ne pouvez modifier que vos propres tâches" };

                if (progress < 0 || progress > 100)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "La progression doit être entre 0 et 100" };

                // Tâche déjà validée → bloquée
                if (task.IsValidated)
                    return new ApiResponse<TaskDTO>
                    { Success = false, Message = "Tâche déjà validée, modification impossible" };

                task.Progress = progress;

                // Statut automatique selon progression
                task.TaskStatusId = progress switch
                {
                    0 => 1,    // À faire
                    100 => 4,  // En attente de validation
                    _ => 2     // En cours
                };

                // Reset validation si le dev revient en arrière
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

        // UPDATE task status (compatibilité)
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

                // Si dev met "Terminé" → forcer 100% + En attente de validation
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

        // VALIDATE task (Chef de Projet)
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

        // GET tasks by project
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

        // GET tasks by user
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

        // DELETE task
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

        // HELPER: Recalculate project progress
        private async Task RecalculateProjectProgressAsync(int projectId)
        {
            var tasks = await _context.ProjectTasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return;

            // Ne pas toucher si déjà Terminé ou Annulé (chef a décidé)
            if (project.ProjectStatusId == 3 || project.ProjectStatusId == 4)
                return;

            if (tasks.Count == 0)
            {
                project.Progress = 0;
                project.ProjectStatusId = 1; // Planifié
            }
            else
            {
                project.Progress = (int)Math.Round(
                    tasks.Average(t => (double)t.Progress)
                );

                if (project.Progress == 0)
                {
                    project.ProjectStatusId = 1; // Planifié
                }
                else
                {
                    // Même à 100%, on reste "En cours" → le chef décide quand Terminé
                    project.ProjectStatusId = 2; // En cours
                }
            }

            await _context.SaveChangesAsync();
        }

        // HELPER: Map ProjectTask to DTO
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
