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
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // POST api/Comment
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDTO dto)
        {
            var userId = GetCurrentUserId();
            var result = await _commentService.CreateCommentAsync(dto, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // PUT api/Comment
        [HttpPut]
        public async Task<IActionResult> UpdateComment([FromBody] UpdateCommentDTO dto)
        {
            var userId = GetCurrentUserId();
            var result = await _commentService.UpdateCommentAsync(dto, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // DELETE api/Comment/{commentId}
        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var userId = GetCurrentUserId();
            var result = await _commentService.DeleteCommentAsync(commentId, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Comment/task/{taskId}
        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskComments(int taskId)
        {
            var result = await _commentService.GetTaskCommentsAsync(taskId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/Comment/{commentId}
        [HttpGet("{commentId}")]
        public async Task<IActionResult> GetCommentById(int commentId)
        {
            var result = await _commentService.GetCommentByIdAsync(commentId);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }
    }
}
