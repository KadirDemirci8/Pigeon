using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pigeon.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationCommentId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommentId",
                table: "Notifications",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommentId",
                table: "Notifications");
        }
    }
}
