namespace ProjectManagementAPI.DTOs
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string? Type { get; set; }
        public bool IsRead { get; set; }
        public int? RelatedProjectId { get; set; }
        public int? RelatedTaskId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }
}
