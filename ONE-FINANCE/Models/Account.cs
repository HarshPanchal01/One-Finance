using SQLite;

namespace ONE_FINANCE.Models;

/// <summary>
/// Represents a bank account (chequing, savings, etc.).
/// </summary>
public class Account : BaseEntity
{
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The type of account (Chequing, Savings, Credit, Cash, etc.)
    /// </summary>
    public AccountType Type { get; set; }

    [MaxLength(100)]
    public string? Institution { get; set; }

    /// <summary>
    /// Current balance of the account.
    /// This can be calculated from transactions or manually set.
    /// </summary>
    public decimal Balance { get; set; }

    /// <summary>
    /// Optional color for UI display.
    /// </summary>
    [MaxLength(20)]
    public string? Color { get; set; }

    /// <summary>
    /// Optional icon identifier.
    /// </summary>
    [MaxLength(50)]
    public string? Icon { get; set; }

    /// <summary>
    /// Whether this is the default account for new transactions.
    /// </summary>
    public bool IsDefault { get; set; }
}

/// <summary>
/// Types of bank/financial accounts.
/// </summary>
public enum AccountType
{
    Chequing,
    Savings,
    Credit,
    Cash,
    Other
}
