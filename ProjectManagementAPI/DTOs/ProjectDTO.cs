namespace ProjectManagementAPI.DTOs
{
    public class ProjectDTO
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string? Description { get; set; }  // ✅ Make nullable
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Progress { get; set; }

        // Team info
        public int TeamId { get; set; }  //  ADDED
        public string TeamName { get; set; }

        // Status info
        public int ProjectStatusId { get; set; }  //  ADDED
        public string StatusName { get; set; }
        public string StatusColor { get; set; }

        // Priority info
        public int PriorityId { get; set; }  //  ADDED
        public string PriorityName { get; set; }

        // Task statistics
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }

        // Dates
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }  //  ADDED (optional)
    }
}
