using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;

namespace OneFinance.ViewModels;

public partial class YearNode : ObservableObject
{
    public YearNode(int year, IEnumerable<(int Year, int Month)> months, bool isExpanded)
    {
        Year = year;
        Months = new ObservableCollection<MonthNode>(months
            .OrderBy(m => m.Month)
            .Select(m => new MonthNode(m.Year, m.Month)));
        _isExpanded = isExpanded;
    }

    public int Year { get; }

    public ObservableCollection<MonthNode> Months { get; }

    [ObservableProperty]
    private bool _isExpanded;
}

public partial class MonthNode : ObservableObject
{
    public MonthNode(int year, int month)
    {
        Year = year;
        Month = month;
    }

    public int Year { get; }
    public int Month { get; }

    [ObservableProperty]
    private bool _isExpanded;

    [ObservableProperty]
    private bool _isSelected;

    public string Name => new DateTime(Year, Month, 1).ToString("MMM");
    public string FullName => new DateTime(Year, Month, 1).ToString("MMMM");
}
