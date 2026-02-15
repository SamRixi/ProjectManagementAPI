namespace ProjectManagementAPI.DTOs
{
    public class ProjectManagerDTO
    {
        public int UserId { get; set; }        // ✅ What frontend needs
        public string FirstName { get; set; }   // ✅ What frontend needs
        public string LastName { get; set; }    // ✅ What frontend needs
        public string Email { get; set; }       // ✅ Optional but useful
        public int teamId { get; set; }         // ✅ For context
        public string teamName { get; set; }    // ✅ For context
    }
}
