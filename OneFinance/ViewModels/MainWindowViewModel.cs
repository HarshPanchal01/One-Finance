using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OneFinance.Services;

namespace OneFinance.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private readonly INavigationService _navigationService;
    private readonly Func<DashboardViewModel> _dashboardFactory;
    private readonly Func<TransactionsViewModel> _transactionsFactory;
    private readonly Func<AccountsViewModel> _accountsFactory;
    private readonly Func<TransactionFormViewModel> _transactionFormFactory;
    private readonly Func<SettingsViewModel> _settingsFactory;

    [ObservableProperty] private ViewModelBase? _currentViewModel;
    [ObservableProperty] private bool _isDashboardSelected = true;
    [ObservableProperty] private bool _isTransactionsSelected;
    [ObservableProperty] private bool _isSettingsSelected;
    [ObservableProperty] private bool _isAccountsSelected;

    public MainWindowViewModel(
        INavigationService navigationService,
        Func<DashboardViewModel> dashboardFactory,
        Func<TransactionsViewModel> transactionsFactory,
        Func<AccountsViewModel> accountsFactory,
        Func<TransactionFormViewModel> transactionFormFactory,
        Func<SettingsViewModel> settingsFactory)
    {
        _navigationService = navigationService;
        _dashboardFactory = dashboardFactory;
        _transactionsFactory = transactionsFactory;
        _accountsFactory = accountsFactory;
        _transactionFormFactory = transactionFormFactory;
        _settingsFactory = settingsFactory;

        Title = "One Finance";
        _navigationService.NavigationChanged += OnNavigationChanged;
        
        // Set initial view
        CurrentViewModel = _dashboardFactory();
        _ = CurrentViewModel.OnAppearingAsync();
    }

    private void OnNavigationChanged(string viewName)
    {
        IsDashboardSelected = viewName == "Dashboard";
        IsTransactionsSelected = viewName is "Transactions" or "TransactionForm";
        IsSettingsSelected = viewName == "Settings";
        IsAccountsSelected = viewName is "Accounts";

        CurrentViewModel = viewName switch
        {
            "Dashboard" => _dashboardFactory(),
            "Transactions" => _transactionsFactory(),
            "TransactionForm" => _transactionFormFactory(),
            "Accounts" =>  _accountsFactory(),
            "Settings" => _settingsFactory(),
            _ => CurrentViewModel
        };
        _ = CurrentViewModel?.OnAppearingAsync();
    }

    [RelayCommand] private void NavigateToDashboard() => _navigationService.NavigateTo("Dashboard");
    [RelayCommand] private void NavigateToTransactions() => _navigationService.NavigateTo("Transactions");
    [RelayCommand] private void NavigateToSettings() => _navigationService.NavigateTo("Settings");

    [RelayCommand] private void NavigateToAccounts() => _navigationService.NavigateTo("Accounts");
}
