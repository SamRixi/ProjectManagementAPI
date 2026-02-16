namespace ProjectManagementAPI.DTOs
{
    public class ProjectManagerDashboardDTO
    {
        public int TotalProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int TasksAwaitingValidation { get; set; }
        public int ActiveMembers { get; set; }
        public List<ProjectStatsDTO> Projects { get; set; }
    }
}
