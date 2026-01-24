using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ProjectManagementAPI.DTOs
{
    public class CreateEdbDTO
    {
        [Required(ErrorMessage = "ProjectId est requis")]
        public int ProjectId { get; set; }

        [Required(ErrorMessage = "Fichier est requis")]
        [PdfOnly] //  Custom attribute for PDF only
        public IFormFile File { get; set; }
    }

    // PDF-only validation attribute
    public class PdfOnlyAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is IFormFile file)
            {
                var extension = Path.GetExtension(file.FileName).ToLower();
                if (extension != ".pdf")
                {
                    return new ValidationResult("Seuls les fichiers PDF (.pdf) sont autorisés");
                }
            }
            return ValidationResult.Success;
        }
    }
}
