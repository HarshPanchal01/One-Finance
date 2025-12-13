using SQLite;

namespace OneFinance.Models;

[Table("LedgerPeriods")]
public class LedgerPeriod : BaseEntity
{
    [Unique]
    public int Year { get; set; }

    public bool IsExpanded { get; set; }
}

[Table("LedgerMonths")]
public class LedgerMonth : BaseEntity
{
    [Indexed]
    public int Year { get; set; }

    [Indexed]
    public int Month { get; set; }
}
