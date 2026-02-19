using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateProgressDTO
    {
        [Required(ErrorMessage = "La progression est requise")]
        [Range(0, 100, ErrorMessage = "La progression doit être entre 0 et 100")]
        public int Progress { get; set; } // 0 à 100
    }
}
