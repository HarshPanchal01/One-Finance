using System;

namespace OneFinance.Services;

public interface ILedgerPeriodContext
{
    (int Year, int? Month)? SelectedPeriod { get; }
    event Action? SelectionChanged;
    void SetSelectedPeriod(int year, int? month);
    void Clear();
    string GetLabel();
}

public class LedgerPeriodContext : ILedgerPeriodContext
{
    private (int Year, int? Month)? _selected;

    public (int Year, int? Month)? SelectedPeriod => _selected;

    public event Action? SelectionChanged;

    public void SetSelectedPeriod(int year, int? month)
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
        if (!_selected.HasValue) return "All time";

        if (!_selected.Value.Month.HasValue)
        {
            return $"Cumulative {_selected.Value.Year}";
        }

        return new DateTime(_selected.Value.Year, _selected.Value.Month.Value, 1).ToString("MMMM yyyy");
    }
}
