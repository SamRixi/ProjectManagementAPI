namespace ProjectManagementAPI.DTOs
{
    public class TeamMemberDTO
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string FullName { get; set; }  // FirstName + LastName
        public string Email { get; set; }
        public string RoleName { get; set; }  // Global role (Admin, Chef de projet, etc.)
        public bool IsActive { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
