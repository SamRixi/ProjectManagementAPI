using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixNotificationNoAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Projects_RelatedProjectId",
                table: "Notifications");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications",
                column: "RelatedTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "ProjectTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Projects_RelatedProjectId",
                table: "Notifications",
                column: "RelatedProjectId",
                principalTable: "Projects",
                principalColumn: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Projects_RelatedProjectId",
                table: "Notifications");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_ProjectTasks_RelatedTaskId",
                table: "Notifications",
                column: "RelatedTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "ProjectTaskId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Projects_RelatedProjectId",
                table: "Notifications",
                column: "RelatedProjectId",
                principalTable: "Projects",
                principalColumn: "ProjectId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
