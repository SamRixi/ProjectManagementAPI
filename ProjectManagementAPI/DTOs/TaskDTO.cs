namespace ProjectManagementAPI.DTOs
{
    public class TaskDTO
    {
        public int TaskId { get; set; }
        public string TaskName { get; set; }
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
        public int Progress { get; set; }
        public bool IsValidated { get; set; }

        public int ProjectId { get; set; }
        public string ProjectName { get; set; }

        public string StatusName { get; set; }
        public string StatusColor { get; set; }

        public string PriorityName { get; set; }

        public string? AssignedToUserName { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
