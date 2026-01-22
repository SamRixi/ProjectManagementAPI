using ProjectManagementAPI.Models;

namespace ProjectManagementAPI.DTOs
{
    public class TeamDetailsDTO
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; }
        public string? Description { get; set; }
        public List<TeamMemberDTO> Members { get; set; } = new();  // Changed from TeamMember to TeamMemberDTO
        public List<ProjectDTO> Projects { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }
}
