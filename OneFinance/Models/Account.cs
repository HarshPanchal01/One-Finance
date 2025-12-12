using SQLite;

namespace OneFinance.Models;

public enum AccountType
{
    Chequing,
    Savings,
    Credit,
    Cash,
    Other
}

[Table("Accounts")]
public class Account : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public string? Institution { get; set; }
    public string? Icon { get; set; }
    public decimal Balance { get; set; }
    public bool IsDefault { get; set; }
}
