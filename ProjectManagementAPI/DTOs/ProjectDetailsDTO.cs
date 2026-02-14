namespace ProjectManagementAPI.DTOs
{
    public class ProjectDetailsDTO
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }  // ✅ Nullable
        public DateTime? EndDate { get; set; }    // ✅ Nullable
        public int Progress { get; set; }

        public TeamDTO Team { get; set; }
        public ProjectStatusDTO Status { get; set; }
        public PriorityDTO Priority { get; set; }

        public List<TaskDTO> Tasks { get; set; } = new();
        public EdbDTO? Edb { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
