namespace ProjectManagementAPI.DTOs
{
    public class SearchUsersDTO
    {
        public string? SearchTerm { get; set; } // Nom, prénom, email, username
        public bool? IsActive { get; set; } // Filtrer par actif/inactif
        public int? RoleId { get; set; } // Filtrer par rôle
    }
}
