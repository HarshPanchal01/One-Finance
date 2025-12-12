using SQLite;

namespace OneFinance.Models;

public enum TransactionType
{
    Income,
    Expense
}

[Table("Transactions")]
public class Transaction : BaseEntity
{
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }

    [Indexed]
    public DateTime Date { get; set; } = DateTime.Today;

    [Indexed]
    public int CategoryId { get; set; }

    [Indexed]
    public int? AccountId { get; set; }

    [Ignore]
    public Category? Category { get; set; }

    [Ignore]
    public Account? Account { get; set; }

    [Ignore]
    public string DisplayAmount => Type == TransactionType.Income 
        ? $"+{Amount:C2}" 
        : $"-{Amount:C2}";

    [Ignore]
    public bool IsIncome => Type == TransactionType.Income;

    [Ignore]
    public bool HasDescription => !string.IsNullOrWhiteSpace(Description);
}
