using BudgetAnalyzer.Api.Data;
using BudgetAnalyzer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BudgetAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        // URL of your Python FastAPI parser service
        private const string ParserServiceUrl = "http://localhost:8000/parse";

        public UploadController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // POST: api/upload
        [HttpPost]
        public async Task<ActionResult> UploadStatement(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (!file.FileName.ToLower().EndsWith(".pdf"))
                return BadRequest("Only PDF files are supported.");

            // --- 1. Forward the PDF to the Python parser service ---
            var client = _httpClientFactory.CreateClient();
            using var form = new MultipartFormDataContent();
            using var stream = file.OpenReadStream();
            var fileContent = new StreamContent(stream);
            form.Add(fileContent, "file", file.FileName);

            HttpResponseMessage parseResponse;
            try
            {
                parseResponse = await client.PostAsync(ParserServiceUrl, form);
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, "Could not reach the parser service. Is it running on port 8000?");
            }

            if (!parseResponse.IsSuccessStatusCode)
            {
                var err = await parseResponse.Content.ReadAsStringAsync();
                return StatusCode(502, $"Parser service error: {err}");
            }

            // --- 2. Read the parsed transactions from the response ---
            var json = await parseResponse.Content.ReadAsStringAsync();
            var parsed = JsonSerializer.Deserialize<ParseResult>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (parsed?.Transactions == null || parsed.Transactions.Count == 0)
                return Ok(new { message = "No transactions found in the statement.", inserted = 0 });

            // --- 3. Dedup + save (same logic as the bulk endpoint) ---
            foreach (var t in parsed.Transactions)
                t.Fingerprint = ComputeFingerprint(t);

            var incoming = parsed.Transactions.Select(t => t.Fingerprint).ToList();
            var existing = await _context.Transactions
                .Where(t => incoming.Contains(t.Fingerprint))
                .Select(t => t.Fingerprint)
                .ToListAsync();
            var existingSet = existing.ToHashSet();

            var seen = new HashSet<string>();
            var toInsert = new List<Transaction>();
            foreach (var t in parsed.Transactions)
            {
                if (existingSet.Contains(t.Fingerprint)) continue;
                if (!seen.Add(t.Fingerprint)) continue;
                toInsert.Add(t);
            }

            _context.Transactions.AddRange(toInsert);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                fileName = file.FileName,
                parsed = parsed.Transactions.Count,
                inserted = toInsert.Count,
                skippedDuplicates = parsed.Transactions.Count - toInsert.Count,
                totalOut = parsed.TotalOut,
                totalIn = parsed.TotalIn
            });
        }

        private static string ComputeFingerprint(Transaction t)
        {
            var raw = $"{t.Date:yyyy-MM-dd}|{t.Description}|{t.Amount}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes);
        }

        // Matches the JSON shape returned by the Python /parse endpoint
        private class ParseResult
        {
            public int Count { get; set; }
            public decimal TotalOut { get; set; }
            public decimal TotalIn { get; set; }
            public List<Transaction> Transactions { get; set; } = new();
        }
    }
}