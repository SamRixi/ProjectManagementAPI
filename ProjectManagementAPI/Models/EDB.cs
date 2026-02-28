namespace ProjectManagementAPI.Models
{
    public class EDB
    {
        public int EdbId { get; set; } // Primary key
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileUrl { get; set; } = string.Empty; // URL or path to the EDB file
        public DateTime UploadedAt { get; set; }      
                 = DateTime.UtcNow;

        // Foreign key
        public int? ProjectId { get; set; } // ← Add ? to make nullable
        public int? UploadedByUserId { get; set; }
        public Project? Project { get; set; }
        public User? UploadedByUser { get; set; }


    }
}
