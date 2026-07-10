namespace BudgetAnalyzer.Api.Models
{
    public class CategorySummary
    {
        public string Category { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public int Count { get; set; }
    }
}
