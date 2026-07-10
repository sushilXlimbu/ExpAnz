using BudgetAnalyzer.Api.Data;
using BudgetAnalyzer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace BudgetAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;     

        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/transactions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetTransaction()
        {
            return await _context.Transactions.ToListAsync();
        }

        // POST: api/transactions
        [HttpPost]
        public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
        }

        // POST: api/transactions/bulk
        [HttpPost("bulk")]
        public async Task<ActionResult> CreateTransactions(List<Transaction> transactions)
        {
            if (transactions == null || transactions.Count == 0)
            {
                return BadRequest("Send at least one transaction.");
            }

            // Compute a fingerprint (date + description + amount) for each incoming transaction
            foreach (var t in transactions)
            {
                t.Fingerprint = ComputeFingerprint(t);
            }

            // Find which fingerprints already exist in the database
            var incomingFingerprints = transactions.Select(t => t.Fingerprint).ToList();
            var existingFingerprints = await _context.Transactions
                .Where(t => incomingFingerprints.Contains(t.Fingerprint))
                .Select(t => t.Fingerprint)
                .ToListAsync();

            var existingSet = existingFingerprints.ToHashSet();

            // Skip anything already in the DB, and any duplicates within this same batch
            var seen = new HashSet<string>();
            var toInsert = new List<Transaction>();
            foreach (var t in transactions)
            {
                if (existingSet.Contains(t.Fingerprint)) continue;   // already in DB
                if (!seen.Add(t.Fingerprint)) continue;              // duplicate within this upload
                toInsert.Add(t);
            }

            _context.Transactions.AddRange(toInsert);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                received = transactions.Count,
                inserted = toInsert.Count,
                skippedDuplicates = transactions.Count - toInsert.Count
            });
        }

        // Builds a deterministic fingerprint so the same transaction always hashes the same way
        private static string ComputeFingerprint(Transaction t)
        {
            var raw = $"{t.Date:yyyy-MM-dd}|{t.Description}|{t.Amount}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes);
        }
    }
}