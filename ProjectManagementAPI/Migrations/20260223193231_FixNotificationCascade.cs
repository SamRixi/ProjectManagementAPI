using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixNotificationCascade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications",
                column: "RelatedTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "ProjectTaskId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications",
                column: "RelatedTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "ProjectTaskId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
