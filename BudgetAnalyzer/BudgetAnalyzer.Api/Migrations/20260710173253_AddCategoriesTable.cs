using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BudgetAnalyzer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Color", "Name" },
                values: new object[,]
                {
                    { 1, "#4287f5", "Groceries" },
                    { 2, "#f5a442", "Transport" },
                    { 3, "#42c88a", "Eating Out" },
                    { 4, "#2e9e4f", "Shopping" },
                    { 5, "#9b59b6", "Wallet Transfer" },
                    { 6, "#34495e", "Investment" },
                    { 7, "#e67e22", "Gift Card" },
                    { 8, "#f1c40f", "Crypto" },
                    { 9, "#1abc9c", "Phone" },
                    { 10, "#e91e63", "Grooming" },
                    { 11, "#7f8c8d", "Credit Card" },
                    { 12, "#e74c3c", "Person-to-Person" },
                    { 13, "#27ae60", "Income" },
                    { 14, "#bdc3c7", "Uncategorized" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
