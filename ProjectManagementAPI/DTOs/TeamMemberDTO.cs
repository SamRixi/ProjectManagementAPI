namespace ProjectManagementAPI.DTOs
{
    public class TeamMemberDTO
    {
      
        // ✅ Team information
        public int TeamId { get; set; }  
        public string TeamName { get; set; } = string.Empty;  

        // User information
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        // ✅ CHANGE: Add FirstName and LastName separately
        public string FirstName { get; set; } = string.Empty; 
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;  

        public string Email { get; set; } = string.Empty;

        // Role information
        public int? RoleId { get; set; }  
        public string RoleName { get; set; } = string.Empty;

        // ✅ Team member specific properties
        public bool IsProjectManager { get; set; }  
        public bool IsActive { get; set; }

      
        public DateTime JoinedDate { get; set; }  
    }
}
