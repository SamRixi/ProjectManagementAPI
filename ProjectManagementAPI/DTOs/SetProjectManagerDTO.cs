using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    public class SetProjectManagerDTO
    {
        [Required]
        public int ProjectId { get; set; }  //which project?

        [Required]
        public int UserId { get; set; }  // Which user?

        [Required]
        public bool IsProjectManager { get; set; }  //  Set as manager or remove
        [Required]
        public int TeamId { get; set; }


    }
}
