namespace ProjectManagementAPI.DTOs
{
    public class CreateEdbDTO
    {
        public int ProjectId { get; set; }
        public IFormFile File { get; set; } // Upload fichier
    }
}
