using BudgetAnalyzer.Api.Data;
using BudgetAnalyzer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : Controller
    {
        private readonly AppDbContext _context;
        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }
        //GET: get/transactions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetTransaction()
        {
            return await _context.Transactions.ToListAsync();
        }
        //POST: post/transactions
        [HttpPost]
        public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
        }
        // POST: api/transactions/bulk
        [HttpPost("bulk")]
        public async Task<ActionResult<IEnumerable<Transaction>>> CreateTransactions(List<Transaction> transactions)
        {
            if (transactions == null || transactions.Count == 0)
            {
                return BadRequest("Send at least one transaction.");
            }

            _context.Transactions.AddRange(transactions);
            await _context.SaveChangesAsync();

            return Ok(transactions);
        }
    }
}
