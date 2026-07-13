using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BudgetAnalyzer.Api.Data;
using BudgetAnalyzer.Api.Models;

namespace BudgetAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SummaryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SummaryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/summary?startDate=2026-06-01&endDate=2026-06-30
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategorySummary>>> GetSummary(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (startDate > endDate)
            {
                return BadRequest("startDate must be on or before endDate.");
            }

            var summary = await _context.Transactions
                .Where(t => t.Date >= startDate && t.Date <= endDate)
                .GroupBy(t => t.Category)
                .Select(g => new CategorySummary
                {
                    Category = g.Key,
                    TotalOut = g.Where(t => t.Amount < 0).Sum(t => t.Amount),
                    TotalIn = g.Where(t => t.Amount > 0).Sum(t => t.Amount),
                    Net = g.Sum(t => t.Amount),
                    Count = g.Count()
                })
                .OrderBy(c => c.TotalOut)
                .ToListAsync();

            return summary;
        }
    }
}