using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEdbFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs");

            migrationBuilder.AlterColumn<int>(
                name: "UploadedByUserId",
                table: "EDBs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs");

            migrationBuilder.AlterColumn<int>(
                name: "UploadedByUserId",
                table: "EDBs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
