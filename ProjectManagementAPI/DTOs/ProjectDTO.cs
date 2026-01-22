namespace ProjectManagementAPI.DTOs
{
    public class ProjectDTO
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Progress { get; set; }
        public string TeamName { get; set; }
        public string StatusName { get; set; }
        public string StatusColor { get; set; }
        public string PriorityName { get; set; }
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
