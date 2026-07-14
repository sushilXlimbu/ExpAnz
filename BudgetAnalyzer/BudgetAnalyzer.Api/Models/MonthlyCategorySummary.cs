namespace BudgetAnalyzer.Api.Models
{
    public class MonthlyCategorySummary
    {
        public string Month { get; set; } = string.Empty;   // "2026-04"
        public string Category { get; set; } = string.Empty;
        public decimal TotalOut { get; set; }   // spending (negatives)
        public decimal TotalIn { get; set; }    // money back in (positives)
        public decimal Net { get; set; }
        public int Count { get; set; }
    }
}