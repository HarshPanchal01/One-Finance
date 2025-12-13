using System;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using OneFinance.Services;

namespace OneFinance.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private readonly INavigationService _navigationService;
    private readonly IDatabaseService _databaseService;
    private readonly ILedgerPeriodContext _periodContext;
    private readonly Func<DashboardViewModel> _dashboardFactory;
    private readonly Func<TransactionsViewModel> _transactionsFactory;
    private readonly Func<TransactionFormViewModel> _transactionFormFactory;
    private readonly Func<SettingsViewModel> _settingsFactory;

    [ObservableProperty] private ViewModelBase? _currentViewModel;
    [ObservableProperty] private bool _isDashboardSelected = true;
    [ObservableProperty] private bool _isTransactionsSelected;
    [ObservableProperty] private bool _isSettingsSelected;
    [ObservableProperty] private ObservableCollection<YearNode> _yearFolders = new();
    [ObservableProperty] private object? _selectedTreeNode;
    [ObservableProperty] private string _periodStatus = "All time";
    [ObservableProperty] private bool _isYearPromptVisible;
    [ObservableProperty] private int _newYearValue = DateTime.Now.Year;
    [ObservableProperty] private bool _isDeleteYearConfirmationVisible;
    [ObservableProperty] private YearNode? _yearToDelete;

    public MainWindowViewModel(
        INavigationService navigationService,
        IDatabaseService databaseService,
        ILedgerPeriodContext periodContext,
        Func<DashboardViewModel> dashboardFactory,
        Func<TransactionsViewModel> transactionsFactory,
        Func<TransactionFormViewModel> transactionFormFactory,
        Func<SettingsViewModel> settingsFactory)
    {
        _navigationService = navigationService;
        _databaseService = databaseService;
        _periodContext = periodContext;
        _dashboardFactory = dashboardFactory;
        _transactionsFactory = transactionsFactory;
        _transactionFormFactory = transactionFormFactory;
        _settingsFactory = settingsFactory;

        Title = "One Finance";
        _navigationService.NavigationChanged += OnNavigationChanged;
        PeriodStatus = _periodContext.GetLabel();
        _ = LoadLedgerTreeAsync();
        
        // Set initial view
        CurrentViewModel = _dashboardFactory();
        _ = CurrentViewModel.OnAppearingAsync();
    }

    private void OnNavigationChanged(string viewName)
    {
        IsDashboardSelected = viewName == "Dashboard";
        IsTransactionsSelected = viewName is "Transactions" or "TransactionForm";
        IsSettingsSelected = viewName == "Settings";

        CurrentViewModel = viewName switch
        {
            "Dashboard" => _dashboardFactory(),
            "Transactions" => _transactionsFactory(),
            "TransactionForm" => _transactionFormFactory(),
            "Settings" => _settingsFactory(),
            _ => CurrentViewModel
        };
        _ = CurrentViewModel?.OnAppearingAsync();
    }

    [RelayCommand] private void NavigateToDashboard() => _navigationService.NavigateTo("Dashboard");
    
    [RelayCommand] 
    private void NavigateToTransactions()
    {
        _periodContext.Clear();
        PeriodStatus = _periodContext.GetLabel();
        SelectedTreeNode = null;
        _navigationService.NavigateTo("Transactions");
    }

    [RelayCommand] private void NavigateToSettings() => _navigationService.NavigateTo("Settings");

    [RelayCommand]
    private void PromptDeleteYear(YearNode yearNode)
    {
        YearToDelete = yearNode;
        IsDeleteYearConfirmationVisible = true;
    }

    [RelayCommand]
    private void CancelDeleteYear()
    {
        YearToDelete = null;
        IsDeleteYearConfirmationVisible = false;
    }

    [RelayCommand]
    private async Task ConfirmDeleteYearAsync()
    {
        if (YearToDelete is null) return;
        
        await _databaseService.DeleteLedgerYearAsync(YearToDelete.Year);
        YearFolders.Remove(YearToDelete);
        
        if (_periodContext.SelectedPeriod?.Year == YearToDelete.Year)
        {
            _periodContext.Clear();
            PeriodStatus = _periodContext.GetLabel();
            SelectedTreeNode = null;
        }

        YearToDelete = null;
        IsDeleteYearConfirmationVisible = false;
    }

    [RelayCommand]
    private void OpenYearPrompt()
    {
        NewYearValue = DateTime.Now.Year;
        IsYearPromptVisible = true;
    }

    [RelayCommand]
    private void CancelYearPrompt() => IsYearPromptVisible = false;

    [RelayCommand]
    private async Task ConfirmAddYearAsync()
    {
        if (NewYearValue < 1900) return;

        var period = await _databaseService.AddLedgerYearAsync(NewYearValue);
        if (YearFolders.Any(y => y.Year == period.Year)) return;
        var months = await _databaseService.GetLedgerMonthsAsync(period.Year);
        var node = new YearNode(period.Year, months.Select(m => (m.Year, m.Month)), period.IsExpanded);
        AttachYearNode(node);
        PeriodStatus = _periodContext.GetLabel();
        NewYearValue++;
        IsYearPromptVisible = false;
    }

    [RelayCommand]
    private void SelectMonth(MonthNode? monthNode)
    {
        if (monthNode is null) return;
        SelectedTreeNode = monthNode;
    }

    [RelayCommand]
    private void ClearPeriod()
    {
        _periodContext.Clear();
        PeriodStatus = _periodContext.GetLabel();
        SelectedTreeNode = null;
    }

    partial void OnSelectedTreeNodeChanged(object? value)
    {
        switch (value)
        {
            case MonthNode monthNode:
                _periodContext.SetSelectedPeriod(monthNode.Year, monthNode.Month);
                PeriodStatus = _periodContext.GetLabel();
                _navigationService.NavigateTo("Transactions");
                break;
            case YearNode yearNode:
                _periodContext.Clear();
                PeriodStatus = $"Year {yearNode.Year}";
                break;
            default:
                PeriodStatus = _periodContext.GetLabel();
                break;
        }
    }

    partial void OnYearFoldersChanged(ObservableCollection<YearNode> value)
    {
        foreach (var node in value)
        {
            node.PropertyChanged -= OnYearNodePropertyChanged;
            node.PropertyChanged += OnYearNodePropertyChanged;
        }
    }

    private async void OnYearNodePropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (sender is not YearNode node) return;
        if (e.PropertyName == nameof(YearNode.IsExpanded))
        {
            await _databaseService.UpdateLedgerExpandedStateAsync(node.Year, node.IsExpanded);
        }
    }

    private void AttachYearNode(YearNode node)
    {
        var insertIndex = YearFolders.TakeWhile(y => y.Year > node.Year).Count();
        if (insertIndex >= YearFolders.Count)
            YearFolders.Add(node);
        else
            YearFolders.Insert(insertIndex, node);

        node.PropertyChanged += OnYearNodePropertyChanged;
    }

    private async Task LoadLedgerTreeAsync()
    {
        await _databaseService.InitializeAsync();
        var periods = await _databaseService.GetLedgerPeriodsAsync();
        if (periods.Count == 0)
        {
            await _databaseService.AddLedgerYearAsync(DateTime.Now.Year);
            periods = await _databaseService.GetLedgerPeriodsAsync();
        }

        var months = await _databaseService.GetLedgerMonthsAsync();
        var nodes = periods
            .OrderByDescending(p => p.Year)
            .Select(p => new YearNode(p.Year, months.Where(m => m.Year == p.Year).Select(m => (m.Year, m.Month)), p.IsExpanded));

        YearFolders = new ObservableCollection<YearNode>(nodes);
    }
}
