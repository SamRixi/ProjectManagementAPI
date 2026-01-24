namespace ProjectManagementAPI.DTOs
{
    public class EdbDTO
    {
        public int EdbId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public long FileSize { get; set; }
        public string FileType { get; set; }

        public int ProjectId { get; set; }
        public string ProjectName { get; set; }

        public DateTime UploadedAt { get; set; }
        public string? UploadedByUserName { get; set; }  // ✅ Optional (if not tracked)
    }
}
