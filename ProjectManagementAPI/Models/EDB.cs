namespace ProjectManagementAPI.Models
{
    public class EDB
    {
        public int EdbId { get; set; } // Primary key
        public string FileUrl { get; set; } = string.Empty; // URL or path to the EDB file
        // Foreign key 
        public int ProjectId { get; set; } // Foreign key to Project
        // Relation
        public Project Project { get; set; } = null!; // Navigation property to Project

    }
}
