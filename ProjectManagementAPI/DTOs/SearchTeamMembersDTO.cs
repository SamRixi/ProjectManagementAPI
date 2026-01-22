using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class SearchTeamMembersDTO
    {
        [Required]
        public int ProjectId { get; set; }

        public string? SearchTerm { get; set; }
    }
}
