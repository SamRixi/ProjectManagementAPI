namespace ProjectManagementAPI.DTOs
{
    public class TeamDTO
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; }
        public string? Description { get; set; }
        public int MemberCount { get; set; }
        public int ProjectCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
