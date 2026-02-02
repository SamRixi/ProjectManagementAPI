using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.DTOs;
using ProjectManagementAPI.Models;
using ProjectManagementAPI.Services.Interfaces;
using System.Security.Claims;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // ============= CRUD (Reporting uniquement) =============

        [HttpPost]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO dto)
        {
            var result = await _userService.CreateUserAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{userId}")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDTO dto)
        {
            dto.UserId = userId;
            var result = await _userService.UpdateUserAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userService.GetAllUsersAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{userId}")]
        [Authorize]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userService.GetUserByIdAsync(userId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("search")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> SearchUsers([FromQuery] SearchUsersDTO dto)
        {
            var result = await _userService.SearchUsersAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Account Management (Reporting) =============

        // ✅ NEW: Toggle User Status (Activate/Deactivate)
        [HttpPatch("{userId}/toggle-status")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ToggleUserStatus(int userId)
        {
            // Get current user
            var userResult = await _userService.GetUserByIdAsync(userId);
            if (!userResult.Success)
            {
                return NotFound(userResult);
            }

            // Extract current status using reflection or dynamic
            var userData = userResult.Data;
            bool currentStatus = false;

            // Try to get isActive property
            var isActiveProp = userData?.GetType().GetProperty("IsActive");
            if (isActiveProp != null)
            {
                currentStatus = (bool)(isActiveProp.GetValue(userData) ?? false);
            }

            // Toggle the status
            var result = await _userService.ToggleUserActiveAsync(userId, !currentStatus);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{userId}/toggle-active")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> ToggleUserActive(int userId, [FromBody] bool isActive)
        {
            var result = await _userService.ToggleUserActiveAsync(userId, isActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{userId}/deadline")]
        [Authorize(Roles = "Manager,Reporting")]
        public async Task<IActionResult> SetAccountDeadline(int userId, [FromBody] DateTime? deadline)
        {
            var result = await _userService.SetAccountDeadlineAsync(userId, deadline);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ============= Password Management =============

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userService.ChangePasswordAsync(userId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest dto)
        {
            var result = await _userService.ForgotPasswordAsync(dto.Email);
            return Ok(result); // Always return 200 for security
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest dto)
        {
            var result = await _userService.ResetPasswordAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
