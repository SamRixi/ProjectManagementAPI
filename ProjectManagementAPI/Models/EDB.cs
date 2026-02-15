namespace ProjectManagementAPI.Models
{
    public class EDB
    {
        public int EdbId { get; set; } // Primary key
        public string FileUrl { get; set; } = string.Empty; // URL or path to the EDB file
                                                            // Foreign key 
        public int? ProjectId { get; set; } // ← Add ? to make nullable
        public Project? Project { get; set; } // ← Add ? to make optional

    }
}
