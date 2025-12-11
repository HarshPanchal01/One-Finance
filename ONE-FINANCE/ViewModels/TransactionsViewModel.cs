using System.Collections.ObjectModel;
using System.Windows.Input;
using ONE_FINANCE.Models;
using ONE_FINANCE.Services;

namespace ONE_FINANCE.ViewModels;

/// <summary>
/// View model for the Transactions list page.
/// </summary>
public class TransactionsViewModel : BaseViewModel
{
    private readonly DatabaseService _databaseService;
    private ObservableCollection<Transaction> _transactions = [];
    private Transaction? _selectedTransaction;

    public TransactionsViewModel(IDatabaseService databaseService)
    {
        _databaseService = (DatabaseService)databaseService;
        Title = "Transactions";

        AddTransactionCommand = new Command(async () => await AddTransactionAsync());
        DeleteTransactionCommand = new Command<Transaction>(async (t) => await DeleteTransactionAsync(t));
        RefreshCommand = new Command(async () => await LoadTransactionsAsync());
    }

    /// <summary>
    /// Collection of transactions to display.
    /// </summary>
    public ObservableCollection<Transaction> Transactions
    {
        get => _transactions;
        set => SetProperty(ref _transactions, value);
    }

    /// <summary>
    /// Currently selected transaction (for navigation to edit).
    /// </summary>
    public Transaction? SelectedTransaction
    {
        get => _selectedTransaction;
        set
        {
            if (SetProperty(ref _selectedTransaction, value) && value != null)
            {
                // Navigate to edit page
                _ = EditTransactionAsync(value);
                SelectedTransaction = null; // Reset selection
            }
        }
    }

    public ICommand AddTransactionCommand { get; }
    public ICommand DeleteTransactionCommand { get; }
    public ICommand RefreshCommand { get; }

    /// <summary>
    /// Called when the page appears.
    /// </summary>
    public override async Task OnAppearingAsync()
    {
        await LoadTransactionsAsync();
    }

    /// <summary>
    /// Loads all transactions from the database.
    /// </summary>
    private async Task LoadTransactionsAsync()
    {
        await ExecuteAsync(async () =>
        {
            var transactions = await _databaseService.GetTransactionsWithDetailsAsync();
            
            Transactions.Clear();
            foreach (var transaction in transactions)
            {
                Transactions.Add(transaction);
            }
        }, "Failed to load transactions");
    }

    /// <summary>
    /// Navigates to add a new transaction.
    /// </summary>
    private async Task AddTransactionAsync()
    {
        await NavigationService.NavigateToAsync(AppRoutes.TransactionForm);
    }

    /// <summary>
    /// Navigates to edit an existing transaction.
    /// </summary>
    private async Task EditTransactionAsync(Transaction transaction)
    {
        await NavigationService.NavigateToAsync(AppRoutes.TransactionForm, "id", transaction.Id);
    }

    /// <summary>
    /// Deletes a transaction after confirmation.
    /// </summary>
    private async Task DeleteTransactionAsync(Transaction transaction)
    {
        var page = Application.Current?.Windows.FirstOrDefault()?.Page;
        if (page == null) return;

        bool confirm = await page.DisplayAlertAsync(
            "Delete Transaction",
            $"Are you sure you want to delete \"{transaction.Description}\"?",
            "Delete",
            "Cancel");

        if (!confirm)
            return;

        await ExecuteAsync(async () =>
        {
            await _databaseService.DeleteAsync(transaction);
            Transactions.Remove(transaction);
        }, "Failed to delete transaction");
    }
}
