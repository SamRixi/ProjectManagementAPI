namespace ProjectManagementAPI.Models
{
    public class Role
    {
        public int RoleId { get; set; } // Primary key
        public string RoleName { get; set; } // Name of the role ( project manager , assistante , membre d equipe)
       
        // relation 
       public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>(); // Relation to TeamMembers 
    }
}
