namespace ProjectManagementAPI.DTOs
{
    public class CommentDTO
    {
        public int CommentId { get; set; }
        public int TaskId { get; set; }
        public string TaskName { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
