using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class Reportingnotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedUserId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RelatedUserId",
                table: "Notifications",
                column: "RelatedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Users_RelatedUserId",
                table: "Notifications",
                column: "RelatedUserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Users_RelatedUserId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RelatedUserId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedUserId",
                table: "Notifications");
        }
    }
}
