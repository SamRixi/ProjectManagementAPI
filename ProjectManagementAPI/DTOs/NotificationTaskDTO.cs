namespace ProjectManagementAPI.DTOs
{
    public class NotificationTaskDTO
    {
        public int TaskId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public DateTime Deadline { get; set; }
        public int Progression { get; set; }
        public bool IsValidated { get; set; }
        public string Status { get; set; }
        public string? RejectionReason { get; set; }
    }
}
