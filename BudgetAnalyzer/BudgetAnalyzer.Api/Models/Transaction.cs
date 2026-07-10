namespace BudgetAnalyzer.Api.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = "Uncategorized";
        public string SourceBank { get; set; } = string.Empty;
        public string StatementMonth { get; set; } = string.Empty;
        public string Fingerprint { get; set; } = string.Empty;
        public string Merchant { get; set; } = string.Empty;
    }
}
