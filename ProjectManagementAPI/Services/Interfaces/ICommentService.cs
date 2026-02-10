using ProjectManagementAPI.DTOs;

namespace ProjectManagementAPI.Services.Interfaces
{
    public interface ICommentService
    {
        Task<ApiResponse<CommentDTO>> CreateCommentAsync(CreateCommentDTO dto, int createdByUserId);
        Task<ApiResponse<CommentDTO>> UpdateCommentAsync(UpdateCommentDTO dto, int userId);
        Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, int userId);
        Task<ApiResponse<List<CommentDTO>>> GetTaskCommentsAsync(int taskId);
        Task<ApiResponse<CommentDTO>> GetCommentByIdAsync(int commentId);
    }
}
