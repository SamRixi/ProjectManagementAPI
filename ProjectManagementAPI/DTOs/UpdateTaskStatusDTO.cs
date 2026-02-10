using System.ComponentModel.DataAnnotations;

namespace ProjectManagementAPI.DTOs
{
    /// <summary>
    /// DTO pour mettre à jour uniquement le statut d'une tâche
    /// Utilisé par les membres d'équipe pour leurs propres tâches
    /// </summary>
    public class UpdateTaskStatusDTO
    {
        [Required(ErrorMessage = "Le statut est requis")]
        [Range(1, 3, ErrorMessage = "Statut invalide. Valeurs possibles : 1 (À faire), 2 (En cours), 3 (Terminé)")]
        public int ProjectTaskStatusId { get; set; }
    }
}