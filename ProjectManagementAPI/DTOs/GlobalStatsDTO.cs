namespace ProjectManagementAPI.DTOs
{
    public class GlobalStatsDTO
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TotalTeams { get; set; }
        public int AverageProgress { get; set; }
        public int DelayedProjects { get; set; }
    }
}
