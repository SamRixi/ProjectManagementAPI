namespace ProjectManagementAPI.DTOs
{
    public class ProjectStatsDTO
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int TodoTasks { get; set; }
        public int Progress { get; set; }
        public bool IsDelayed { get; set; }
    }
}
