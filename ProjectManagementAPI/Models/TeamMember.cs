namespace ProjectManagementAPI.Models
{
    public class TeamMember
    {
        public int TeamMemberId { get; set; } // Primary key
        public bool IsProjectManager { get; set; } = false; // Indicates if the member is a project manager
        public bool IsActive { get; set; } = true;  
        // Foreign keys
        public int UserId { get; set; } // Foreign key to User
        public int TeamId { get; set; } // Foreign key to Team
       

        // Relations
        public User User { get; set; } // Navigation property to User
        public Team Team { get; set; } // Navigation property to Team
   

        public DateTime JoinedDate { get; set; } = DateTime.UtcNow; // Date when the member joined the team
        public DateTime? LeftDate { get; set; }
    }
}
