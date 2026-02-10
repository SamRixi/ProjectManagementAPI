using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;

namespace ProjectManagementAPI.Services.Implementations
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;

        public CommentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<CommentDTO>> CreateCommentAsync(CreateCommentDTO dto, int createdByUserId)
        {
            try
            {
                var task = await _context.ProjectTasks.FindAsync(dto.TaskId);
                if (task == null)
                {
                    return new ApiResponse<CommentDTO>
                    {
                        Success = false,
                        Message = "Tâche introuvable"
                    };
                }

                var comment = new Comment
                {
                    TaskId = dto.TaskId,
                    CreatedByUserId = createdByUserId,
                    Content = dto.Content,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                var createdComment = await _context.Comments
                    .Include(c => c.CreatedByUser)
                    .Include(c => c.ProjectTask)
                    .FirstOrDefaultAsync(c => c.CommentId == comment.CommentId);

                return new ApiResponse<CommentDTO>
                {
                    Success = true,
                    Message = "Commentaire ajouté avec succès",
                    Data = MapToDto(createdComment)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CommentDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<CommentDTO>> UpdateCommentAsync(UpdateCommentDTO dto, int userId)
        {
            try
            {
                var comment = await _context.Comments
                    .Include(c => c.CreatedByUser)
                    .Include(c => c.ProjectTask)
                    .FirstOrDefaultAsync(c => c.CommentId == dto.CommentId);

                if (comment == null)
                {
                    return new ApiResponse<CommentDTO>
                    {
                        Success = false,
                        Message = "Commentaire introuvable"
                    };
                }

                if (comment.CreatedByUserId != userId)
                {
                    return new ApiResponse<CommentDTO>
                    {
                        Success = false,
                        Message = "Vous ne pouvez modifier que vos propres commentaires"
                    };
                }

                comment.Content = dto.Content;
                comment.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<CommentDTO>
                {
                    Success = true,
                    Message = "Commentaire mis à jour",
                    Data = MapToDto(comment)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CommentDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, int userId)
        {
            try
            {
                var comment = await _context.Comments.FindAsync(commentId);

                if (comment == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Commentaire introuvable"
                    };
                }

                if (comment.CreatedByUserId != userId)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Vous ne pouvez supprimer que vos propres commentaires"
                    };
                }

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Commentaire supprimé",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<CommentDTO>>> GetTaskCommentsAsync(int taskId)
        {
            try
            {
                var task = await _context.ProjectTasks.FindAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<List<CommentDTO>>
                    {
                        Success = false,
                        Message = "Tâche introuvable"
                    };
                }

                var comments = await _context.Comments
                    .Where(c => c.TaskId == taskId)
                    .Include(c => c.CreatedByUser)
                    .Include(c => c.ProjectTask)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();

                var commentDtos = comments.Select(c => MapToDto(c)).ToList();

                return new ApiResponse<List<CommentDTO>>
                {
                    Success = true,
                    Message = $"{commentDtos.Count} commentaire(s) trouvé(s)",
                    Data = commentDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CommentDTO>>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<CommentDTO>> GetCommentByIdAsync(int commentId)
        {
            try
            {
                var comment = await _context.Comments
                    .Include(c => c.CreatedByUser)
                    .Include(c => c.ProjectTask)
                    .FirstOrDefaultAsync(c => c.CommentId == commentId);

                if (comment == null)
                {
                    return new ApiResponse<CommentDTO>
                    {
                        Success = false,
                        Message = "Commentaire introuvable"
                    };
                }

                return new ApiResponse<CommentDTO>
                {
                    Success = true,
                    Message = "Commentaire récupéré",
                    Data = MapToDto(comment)
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CommentDTO>
                {
                    Success = false,
                    Message = $"Erreur : {ex.Message}"
                };
            }
        }

        private static CommentDTO MapToDto(Comment comment)
        {
            return new CommentDTO
            {
                CommentId = comment.CommentId,
                TaskId = comment.TaskId,
                TaskName = comment.ProjectTask?.TaskName ?? "",
                CreatedByUserId = comment.CreatedByUserId,
                CreatedByUserName = comment.CreatedByUser != null
                    ? $"{comment.CreatedByUser.FirstName} {comment.CreatedByUser.LastName}"
                    : "Inconnu",
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }
    }
}
