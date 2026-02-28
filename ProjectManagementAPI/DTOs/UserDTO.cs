namespace ProjectManagementAPI.DTOs
{
    public class UserDTO
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string RoleName { get; set; }
        public int? RoleId { get; set; }
        public bool IsActive { get; set; }
        public bool MustChangePassword { get; set; }
    
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public List<TeamMemberDTO>? TeamMemberships { get; set; }
    }
}
