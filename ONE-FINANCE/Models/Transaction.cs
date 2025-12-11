using SQLite;

namespace ONE_FINANCE.Models;

/// <summary>
/// Represents a financial transaction (income or expense).
/// </summary>
public class Transaction : BaseEntity
{
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    /// <summary>
    /// Foreign key to the Category table.
    /// </summary>
    [Indexed]
    public int CategoryId { get; set; }

    /// <summary>
    /// Foreign key to the Account table (nullable for uncategorized).
    /// </summary>
    [Indexed]
    public int? AccountId { get; set; }

    /// <summary>
    /// Date of the transaction (indexed for fast Year/Month queries).
    /// </summary>
    [Indexed]
    public DateTime Date { get; set; } = DateTime.Today;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties (not stored in DB, populated manually)
    [Ignore]
    public Category? Category { get; set; }

    [Ignore]
    public Account? Account { get; set; }
}

/// <summary>
/// Defines the type of transaction.
/// </summary>
public enum TransactionType
{
    Income,
    Expense
}
