namespace ProjectManagementAPI.Models
{
    public class Role
    {
        public int RoleId { get; set; } // Primary key
        public string RoleName { get; set; } // Name of the role ( project manager , reporting/manager , membre d equipe)

        // relation 
        public ICollection<User> Users { get; set; } = new List<User>();

       
    }
}
