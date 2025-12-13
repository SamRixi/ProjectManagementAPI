 using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Models;
namespace ProjectManagementAPI.Data
{
    /// ApplicationDbContext - Gestionnaire de la base de données
    /// Hérite de DbContext (Entity Framework Core)
    /// Gère toutes les tables et relations
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options)
        {
        }
        // ============= DbSets (Tables) ============= 
        public DbSet<User>Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Team>Teams { get; set; }
        public DbSet<TeamMember>TeamMembers { get; set; }
        public DbSet<Project>Projects { get; set; }
        public DbSet<ProjectStatus> ProjectStatuses { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }

        public DbSet<ProjectTaskStatus> ProjectTaskStatuses { get; set; }

        public DbSet<Priority> Priorities { get; set; }
        public DbSet<EDB> EDBs { get; set; }

        // ============= OnModelCreating (Configuration des relations) ===========
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Configuration des relations et contraintes supplémentaires si nécessaire
            // Par exemple, configuration des clés étrangères, des relations many-to-many, etc.


            // ========== User - TeamMember (1 to many) ==========

            modelBuilder.Entity<TeamMember>()
               .HasOne(tm => tm.User)
               .WithMany(u => u.TeamMembers)
               .HasForeignKey(tm => tm.UserId)
               .OnDelete(DeleteBehavior.Cascade);
            // ========== RELATION 2: Team "représente" TeamMember ==========
            // Team (1) ─── * TeamMember
            modelBuilder.Entity<TeamMember>()
              .HasOne(tm => tm.Team)
              .WithMany(t => t.TeamMembers)
              .HasForeignKey(tm => tm.TeamId)
              .OnDelete(DeleteBehavior.Cascade);
            // ========== RELATION 3: Role "possède" TeamMember ==========
            // Role (1) ─── * TeamMember
            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Role)
                .WithMany(r => r.TeamMembers)
                .HasForeignKey(tm => tm.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
            // ========== RELATION 4: Team "crée" Project ==========
            // Team (1) ─── * Project
            modelBuilder.Entity<Project>()
              .HasOne(p => p.Team)
              .WithMany(t => t.Projects)
              .HasForeignKey(p => p.TeamId)
              .OnDelete(DeleteBehavior.Cascade);
            // ========== RELATION 5: ProjectStatus "a" Project ==========
            // ProjectStatus (1) ─── * Project
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectStatus)
                .WithMany(ps => ps.Projects)
                .HasForeignKey(p => p.ProjectStatusId)
                .OnDelete(DeleteBehavior.Restrict);
            // ========== RELATION 6: Priority "a" Project ==========
            // Priority (1) ─── * Project
            modelBuilder.Entity<Project>()
            .HasOne(p => p.Priority)
            .WithMany(pr => pr.Projects)
            .HasForeignKey(p => p.PriorityId)
            .OnDelete(DeleteBehavior.Restrict);
            // ========== RELATION 7: Project "contient" ProjectTask ==========
            // Project (1) ─── * ProjectTask
            modelBuilder.Entity<ProjectTask>()
              .HasOne(pt => pt.Project)
              .WithMany(p => p.ProjectTasks)
              .HasForeignKey(pt => pt.ProjectId)
              .OnDelete(DeleteBehavior.Cascade);
            // ========== RELATION 8: ProjectTaskStatus "a" ProjectTask ==========
            // ProjectTaskStatus (1) ─── * ProjectTask
            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.ProjectTasksStatus)
                .WithMany(ts => ts.ProjectTasks)
                .HasForeignKey(t => t.TaskStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== RELATION 9: Priority "a" ProjectTask ==========
            // Priority (1) ─── * ProjectTask
            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.Priority)
                .WithMany(p => p.ProjectTasks)
                .HasForeignKey(t => t.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========== RELATION 10: Project "référence" EDB ==========
            // Project (1) ─── * EDB
            modelBuilder.Entity<EDB>()
                .HasOne(e => e.Project)
                .WithMany(p => p.EDBs)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }
}
