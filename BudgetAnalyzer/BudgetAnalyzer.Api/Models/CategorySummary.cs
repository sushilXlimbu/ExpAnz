namespace BudgetAnalyzer.Api.Models
{
    public class CategorySummary
    {
        public string Category { get; set; } = string.Empty;
        public decimal TotalOut { get; set; }   // spending only (negatives)
        public decimal TotalIn { get; set; }    // money received (positives)
        public decimal Net { get; set; }        // the difference
        public int Count { get; set; }
    }
}