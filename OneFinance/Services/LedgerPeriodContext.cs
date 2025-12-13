using System;

namespace OneFinance.Services;

public interface ILedgerPeriodContext
{
    (int Year, int Month)? SelectedPeriod { get; }
    event Action? SelectionChanged;
    void SetSelectedPeriod(int year, int month);
    void Clear();
    string GetLabel();
}

public class LedgerPeriodContext : ILedgerPeriodContext
{
    private (int Year, int Month)? _selected;

    public (int Year, int Month)? SelectedPeriod => _selected;

    public event Action? SelectionChanged;

    public void SetSelectedPeriod(int year, int month)
    {
        _selected = (year, month);
        SelectionChanged?.Invoke();
    }

    public void Clear()
    {
        _selected = null;
        SelectionChanged?.Invoke();
    }

    public string GetLabel()
    {
        return _selected.HasValue
            ? new DateTime(_selected.Value.Year, _selected.Value.Month, 1).ToString("MMMM yyyy")
            : "All time";
    }
}
