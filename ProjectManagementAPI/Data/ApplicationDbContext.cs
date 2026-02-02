using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Models;

namespace ProjectManagementAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // ============= DbSets (Tables) ============= 
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectStatus> ProjectStatuses { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<ProjectTaskStatus> ProjectTaskStatuses { get; set; }
        public DbSet<Priority> Priorities { get; set; }
        public DbSet<EDB> EDBs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Comment> Comments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========== User - Role ==========
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== User - ProjectTask (Assignment) ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(pt => pt.AssignedToUser)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(pt => pt.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);  // ✅ FIXED: Changed from SetNull

            // ========== User - ProjectTask (CreatedBy) ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(pt => pt.CreatedByUser)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(pt => pt.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== User - ProjectTask (ValidatedBy) ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(pt => pt.ValidatedByUser)
                .WithMany()
                .HasForeignKey(pt => pt.ValidatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);  // ✅ FIXED: Changed from SetNull

            // ========== User - TeamMember ==========
            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMembers)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== Team - TeamMember ==========
            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.TeamMembers)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Can cascade delete team members

            // ========== COMPOSITE KEY: TeamMember ==========
            modelBuilder.Entity<TeamMember>()
                .HasKey(tm => new { tm.TeamId, tm.UserId });

            // ========== Team - Project ==========
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Team)
                .WithMany(t => t.Projects)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Restrict);  // ✅ CHANGED: Don't delete team if it has projects

            // ========== User - Project (CreatedBy) ==========
            modelBuilder.Entity<Project>()
                .HasOne(p => p.CreatedByUser)
                .WithMany(u => u.CreatedProjects)
                .HasForeignKey(p => p.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== User - Project (ProjectManager) ==========
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectManager)
                .WithMany(u => u.ManagedProjects)
                .HasForeignKey(p => p.ProjectManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== ProjectStatus - Project ==========
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectStatus)
                .WithMany(ps => ps.Projects)
                .HasForeignKey(p => p.ProjectStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== Priority - Project ==========
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Priority)
                .WithMany(pr => pr.Projects)
                .HasForeignKey(p => p.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== Project - ProjectTask ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(pt => pt.Project)
                .WithMany(p => p.ProjectTasks)
                .HasForeignKey(pt => pt.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Delete tasks when project deleted

            // ========== ProjectTaskStatus - ProjectTask ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.ProjectTasksStatus)
                .WithMany(ts => ts.ProjectTasks)
                .HasForeignKey(t => t.TaskStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== Priority - ProjectTask ==========
            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.Priority)
                .WithMany(p => p.ProjectTasks)
                .HasForeignKey(t => t.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== Project - EDB ==========
            modelBuilder.Entity<EDB>()
                .HasOne(e => e.Project)
                .WithMany(p => p.EDBs)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Delete EDBs when project deleted

            // ========== User - PasswordResetToken ==========
            modelBuilder.Entity<PasswordResetToken>()
                .HasOne(prt => prt.User)
                .WithMany()
                .HasForeignKey(prt => prt.UserId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Delete tokens when user deleted

            // ========== User - Notification ==========
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Delete notifications when user deleted

            // ========== Notification - Project (Optional) ==========
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.RelatedProject)
                .WithMany()
                .HasForeignKey(n => n.RelatedProjectId)
                .OnDelete(DeleteBehavior.Restrict);  // ✅ FIXED: Changed from SetNull to avoid conflicts

            // ========== Notification - ProjectTask (Optional) ==========
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.RelatedTask)
                .WithMany()
                .HasForeignKey(n => n.RelatedTaskId)
                .OnDelete(DeleteBehavior.Restrict);  // ✅ FIXED: Changed from SetNull to avoid conflicts

            // ========== Comment - ProjectTask ==========
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.ProjectTask)
                .WithMany(pt => pt.Comments)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);  // ✅ OK: Delete comments when task deleted

            // ========== Comment - User (CreatedBy) ==========
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.CreatedByUser)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========== INDEXES ==========
            modelBuilder.Entity<User>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.UserId);

            modelBuilder.Entity<Comment>()
                .HasIndex(c => c.TaskId);
        }
    }
}
