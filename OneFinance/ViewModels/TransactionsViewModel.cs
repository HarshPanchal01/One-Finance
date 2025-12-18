using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OneFinance.Models;
using OneFinance.Services;

namespace OneFinance.ViewModels;

public partial class TransactionsViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;
    private readonly INavigationService _navigationService;
    private readonly ILedgerPeriodContext _periodContext;

    [ObservableProperty] private ObservableCollection<Transaction> _transactions = new();
    [ObservableProperty] private ObservableCollection<Transaction> _incomeTransactions = new();
    [ObservableProperty] private ObservableCollection<Transaction> _expenseTransactions = new();
    [ObservableProperty] private decimal _totalIncome;
    [ObservableProperty] private decimal _totalExpenses;
    [ObservableProperty] private string _selectedPeriodLabel = "All time";
    [ObservableProperty] private bool _isDeleteConfirmationVisible;
    [ObservableProperty] private Transaction? _transactionToDelete;

    public TransactionsViewModel(IDatabaseService databaseService, INavigationService navigationService, ILedgerPeriodContext periodContext)
    {
        _databaseService = databaseService;
        _navigationService = navigationService;
        _periodContext = periodContext;
        Title = "Transactions";

        _periodContext.SelectionChanged += OnPeriodChanged;
        SelectedPeriodLabel = _periodContext.GetLabel();
    }

    public override async Task OnAppearingAsync() => await LoadDataAsync();

    private async void OnPeriodChanged()
    {
        SelectedPeriodLabel = _periodContext.GetLabel();
        await LoadDataAsync();
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        await ExecuteAsync(async () =>
        {
            var selection = _periodContext.SelectedPeriod;
            var transactions = selection.HasValue
                ? await _databaseService.GetTransactionsWithDetailsAsync(selection.Value.Year, selection.Value.Month)
                : await _databaseService.GetTransactionsWithDetailsAsync();
            Transactions = new ObservableCollection<Transaction>(transactions);
            IncomeTransactions = new ObservableCollection<Transaction>(transactions.Where(t => t.Type == TransactionType.Income));
            ExpenseTransactions = new ObservableCollection<Transaction>(transactions.Where(t => t.Type == TransactionType.Expense));
            TotalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            TotalExpenses = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
        });
    }

    [RelayCommand]
    private void AddTransaction() => _navigationService.NavigateTo("TransactionForm");

    [RelayCommand]
    private void EditTransaction(Transaction? t) { if (t != null) _navigationService.NavigateTo("TransactionForm", t.Id); }

    [RelayCommand]
    private void PromptDeleteTransaction(Transaction? t)
    {
        if (t == null) return;
        TransactionToDelete = t;
        IsDeleteConfirmationVisible = true;
    }

    [RelayCommand]
    private void CancelDeleteTransaction()
    {
        TransactionToDelete = null;
        IsDeleteConfirmationVisible = false;
    }

    [RelayCommand]
    private async Task ConfirmDeleteTransactionAsync()
    {
        if (TransactionToDelete == null) return;
        
        await _databaseService.DeleteAsync(TransactionToDelete);
        Transactions.Remove(TransactionToDelete);
        
        // Remove from filtered collection and recalculate totals
        if (TransactionToDelete.Type == TransactionType.Income)
        {
            IncomeTransactions.Remove(TransactionToDelete);
            TotalIncome -= TransactionToDelete.Amount;
        }
        else
        {
            ExpenseTransactions.Remove(TransactionToDelete);
            TotalExpenses -= TransactionToDelete.Amount;
        }

        TransactionToDelete = null;
        IsDeleteConfirmationVisible = false;
    }
}
