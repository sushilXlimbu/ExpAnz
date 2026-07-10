using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BudgetAnalyzer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Merchant",
                table: "Transactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Merchant",
                table: "Transactions");
        }
    }
}
