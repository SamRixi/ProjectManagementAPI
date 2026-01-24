namespace ProjectManagementAPI.Models
{
    public class User
    {
        public int UserId { get; set; } // Primary key
        public string UserName { get; set; } // User's name
        public string PasswordHash { get; set; } // Hashed password
        public string FirstName { get; set; } // First name
        public string LastName { get; set; } // Last name
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Timestamp of user creation
        public int RoleId { get; set; } // Foreign key to Role
        public Role Role { get; set; } // Navigation property

        public string Email { get; set; }
        public bool IsActive { get; set; } = true;
        public bool MustChangePassword { get; set; } = false;
        public DateTime? AccountDeadline { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
       



        // Relation to TeamMembers 
        public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>(); 
    }
}
