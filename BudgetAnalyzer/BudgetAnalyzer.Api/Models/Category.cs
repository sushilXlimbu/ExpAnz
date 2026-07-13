namespace BudgetAnalyzer.Api.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = "#999999";  // optional, for the chart
    }
}
