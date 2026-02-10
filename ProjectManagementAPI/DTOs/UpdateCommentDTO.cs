using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class UpdateCommentDTO
    {
        [Required]
        public int CommentId { get; set; }

        [Required]
        [StringLength(2000, ErrorMessage = "Le commentaire ne doit pas dépasser 2000 caractères")]
        public string Content { get; set; }
    }
}
