namespace ProjectManagementAPI.DTOs
{
    public class TeamMemberDTO
    {
        public int TeamMemberId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public bool IsProjectManager { get; set; }
        public DateTime JoinedDate { get; set; }
    }
}
