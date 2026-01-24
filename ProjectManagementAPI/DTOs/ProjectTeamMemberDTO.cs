namespace ProjectManagementAPI.DTOs
{
    public class ProjectTeamMemberDTO
    {
        public int ProjectTeamId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string RoleName { get; set; }  // User's global role
        public bool IsProjectManager { get; set; }  // Project-specific: is this user managing THIS project?
        public DateTime JoinedAt { get; set; }
    }
}