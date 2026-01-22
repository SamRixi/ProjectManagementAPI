using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UploadEdbDTO
    {
        [Required(ErrorMessage = "Le fichier est obligatoire")]
        public IFormFile File { get; set; }

        public string? Description { get; set; }
    }
}
