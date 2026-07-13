using BudgetAnalyzer.Api.Data;
using BudgetAnalyzer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.OrderBy(c => c.Name).ToListAsync();
        }

        // POST: api/categories
        [HttpPost]
        public async Task<ActionResult<Category>> CreateCategory(Category category)
        {
            if (string.IsNullOrWhiteSpace(category.Name))
                return BadRequest("Category name is required.");

            // Prevent duplicate names (case-insensitive)
            var exists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower());
            if (exists)
                return Conflict($"A category named '{category.Name}' already exists.");

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            if (category.Name == "Uncategorized")
                return BadRequest("The Uncategorized category cannot be deleted.");

            // Move any transactions in this category back to Uncategorized
            var affected = await _context.Transactions
                .Where(t => t.Category == category.Name)
                .ToListAsync();
            foreach (var t in affected)
                t.Category = "Uncategorized";

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { deleted = category.Name, reassignedTransactions = affected.Count });
        }
    }
}