using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class newthingsadded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "EDBs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "EDBs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "EDBs",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "FileType",
                table: "EDBs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UploadedAt",
                table: "EDBs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "UploadedByUserId",
                table: "EDBs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_EDBs_UploadedByUserId",
                table: "EDBs",
                column: "UploadedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EDBs_Users_UploadedByUserId",
                table: "EDBs");

            migrationBuilder.DropIndex(
                name: "IX_EDBs_UploadedByUserId",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "FileType",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "UploadedAt",
                table: "EDBs");

            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "EDBs");
        }
    }
}
