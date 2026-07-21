using Microsoft.EntityFrameworkCore;
using BudgetAnalyzer.Api.Models;

namespace BudgetAnalyzer.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; }   // <-- new

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            // Seed your existing categories so the table starts populated
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Groceries", Color = "#4287f5" },
                new Category { Id = 2, Name = "Transport", Color = "#f5a442" },
                new Category { Id = 3, Name = "Eating Out", Color = "#42c88a" },
                new Category { Id = 4, Name = "Shopping", Color = "#2e9e4f" },
                new Category { Id = 5, Name = "Wallet Transfer", Color = "#9b59b6" },
                new Category { Id = 6, Name = "Investment", Color = "#34495e" },
                new Category { Id = 7, Name = "Gift Card", Color = "#e67e22" },
                new Category { Id = 8, Name = "Crypto", Color = "#f1c40f" },
                new Category { Id = 9, Name = "Phone", Color = "#1abc9c" },
                new Category { Id = 10, Name = "Grooming", Color = "#e91e63" },
                new Category { Id = 11, Name = "Credit Card", Color = "#7f8c8d" },
                new Category { Id = 12, Name = "Person-to-Person", Color = "#e74c3c" },
                new Category { Id = 13, Name = "Income", Color = "#27ae60" },
                new Category { Id = 14, Name = "Uncategorized", Color = "#bdc3c7" }
            );
        }
    }
}