namespace ProjectManagementAPI.DTOs.Developer
{
    /// <summary>
    /// DTO pour les statistiques du tableau de bord développeur
    /// </summary>
    public class DashboardStatsDTO
    {
        /// <summary>
        /// Nombre de projets actifs auxquels le développeur est assigné
        /// </summary>
        public int ActiveProjects { get; set; }

        /// <summary>
        /// Nombre de tâches en cours (statut = "En cours")
        /// </summary>
        public int TasksInProgress { get; set; }

        /// <summary>
        /// Nombre de tâches terminées ce mois-ci
        /// </summary>
        public int CompletedTasks { get; set; }

        /// <summary>
        /// Nombre de tâches en retard (deadline dépassée et statut != "Terminé")
        /// </summary>
        public int OverdueTasks { get; set; }

        /// <summary>
        /// Nombre total de tâches assignées
        /// </summary>
        public int TotalTasks { get; set; }

        /// <summary>
        /// Nombre de tâches à faire (statut = "À faire")
        /// </summary>
        public int PendingTasks { get; set; }
    }
}
