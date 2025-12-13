namespace ProjectManagementAPI.Models
{
    public class Team
    {
        public int teamId { get; set; } // Primary key
        public string teamName { get; set; } // Name of the team
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Timestamp of team creation

        // Relations
        public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>(); // Relation to TeamMembers
        public ICollection<Project> Projects { get; set; } = new List<Project>(); // Relation to Projects



    }
}
