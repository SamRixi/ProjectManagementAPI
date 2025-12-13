namespace ProjectManagementAPI.Models
{
    public class User
    {
        public int UserId { get; set; } // Primary key
        public string UserName { get; set; } // User's name
        public string PasswordHash { get; set; } // Hashed password
        public string FirstName { get; set; } // First name
        public string LastName { get; set; } // Last name
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relation to TeamMembers 
        public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>(); 
    }
}
