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

    [ObservableProperty] private ObservableCollection<Transaction> _transactions = new();
    [ObservableProperty] private ObservableCollection<Transaction> _incomeTransactions = new();
    [ObservableProperty] private ObservableCollection<Transaction> _expenseTransactions = new();
    [ObservableProperty] private decimal _totalIncome;
    [ObservableProperty] private decimal _totalExpenses;

    public TransactionsViewModel(IDatabaseService databaseService, INavigationService navigationService)
    {
        _databaseService = databaseService;
        _navigationService = navigationService;
        Title = "Transactions";
    }

    public override async Task OnAppearingAsync() => await LoadDataAsync();

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        await ExecuteAsync(async () =>
        {
            var transactions = await _databaseService.GetTransactionsWithDetailsAsync();
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
    private async Task DeleteTransactionAsync(Transaction? t)
    {
        if (t == null) return;
        await _databaseService.DeleteAsync(t);
        Transactions.Remove(t);
        
        // Remove from filtered collection and recalculate totals
        if (t.Type == TransactionType.Income)
        {
            IncomeTransactions.Remove(t);
            TotalIncome -= t.Amount;
        }
        else
        {
            ExpenseTransactions.Remove(t);
            TotalExpenses -= t.Amount;
        }
    }
}
