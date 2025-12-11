using ONE_FINANCE.Models;
using ONE_FINANCE.Services;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace ONE_FINANCE.ViewModels;

/// <summary>
/// ViewModel for adding and editing transactions.
/// Supports both Income and Expense transaction types.
/// </summary>
public class TransactionFormViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IDatabaseService _databaseService;
    private readonly INavigationService _navigationService;

    #region Private Fields

    private int? _transactionId;
    private TransactionType _selectedType = TransactionType.Expense;
    private decimal _amount;
    private string _description = string.Empty;
    private string _notes = string.Empty;
    private DateTime _date = DateTime.Today;
    private Category? _selectedCategory;
    private Account? _selectedAccount;
    private ObservableCollection<Category> _categories = [];
    private ObservableCollection<Account> _accounts = [];
    private bool _isIncome;
    private bool _isEditMode;

    #endregion

    #region Properties

    public int? TransactionId
    {
        get => _transactionId;
        set
        {
            if (SetProperty(ref _transactionId, value))
            {
                if (value.HasValue && value.Value > 0)
                {
                    IsEditMode = true;
                    Title = "Edit Transaction";
                    OnPropertyChanged(nameof(SaveButtonText));
                    _ = LoadTransactionAsync(value.Value);
                }
            }
        }
    }

    public TransactionType SelectedType
    {
        get => _selectedType;
        set => SetProperty(ref _selectedType, value);
    }

    public decimal Amount
    {
        get => _amount;
        set => SetProperty(ref _amount, value);
    }

    public string Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string Notes
    {
        get => _notes;
        set => SetProperty(ref _notes, value);
    }

    public DateTime Date
    {
        get => _date;
        set => SetProperty(ref _date, value);
    }

    public Category? SelectedCategory
    {
        get => _selectedCategory;
        set => SetProperty(ref _selectedCategory, value);
    }

    public Account? SelectedAccount
    {
        get => _selectedAccount;
        set => SetProperty(ref _selectedAccount, value);
    }

    public ObservableCollection<Category> Categories
    {
        get => _categories;
        set => SetProperty(ref _categories, value);
    }

    public ObservableCollection<Account> Accounts
    {
        get => _accounts;
        set => SetProperty(ref _accounts, value);
    }

    public bool IsIncome
    {
        get => _isIncome;
        set
        {
            if (SetProperty(ref _isIncome, value))
            {
                SelectedType = value ? TransactionType.Income : TransactionType.Expense;
                _ = LoadCategoriesAsync();
            }
        }
    }

    public bool IsEditMode
    {
        get => _isEditMode;
        set
        {
            if (SetProperty(ref _isEditMode, value))
            {
                OnPropertyChanged(nameof(SaveButtonText));
            }
        }
    }

    /// <summary>
    /// Dynamic button text based on edit mode.
    /// </summary>
    public string SaveButtonText => IsEditMode ? "Update" : "Save";

    #endregion

    #region Commands

    public ICommand LoadDataCommand { get; }
    public ICommand SetIncomeCommand { get; }
    public ICommand SetExpenseCommand { get; }
    public ICommand SaveCommand { get; }
    public ICommand CancelCommand { get; }

    #endregion

    public TransactionFormViewModel(IDatabaseService databaseService, INavigationService navigationService)
    {
        _databaseService = databaseService;
        _navigationService = navigationService;
        Title = "Add Transaction";

        // Initialize commands
        LoadDataCommand = new Command(async () => await LoadDataAsync());
        SetIncomeCommand = new Command(() => IsIncome = true);
        SetExpenseCommand = new Command(() => IsIncome = false);
        SaveCommand = new Command(async () => await SaveAsync());
        CancelCommand = new Command(async () => await CancelAsync());
    }

    /// <summary>
    /// Handle query parameters for navigation (e.g., transaction ID for editing).
    /// </summary>
    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("id", out var idValue))
        {
            if (idValue is int id)
            {
                TransactionId = id;
            }
            else if (idValue is string idString && int.TryParse(idString, out var parsedId))
            {
                TransactionId = parsedId;
            }
        }
    }

    /// <summary>
    /// Load initial data (categories, accounts) when page appears.
    /// </summary>
    private async Task LoadDataAsync()
    {
        await ExecuteAsync(async () =>
        {
            // Load accounts
            var accounts = await _databaseService.GetAllAsync<Account>();
            Accounts = new ObservableCollection<Account>(accounts);
            
            // Select default account
            SelectedAccount = Accounts.FirstOrDefault(a => a.IsDefault) ?? Accounts.FirstOrDefault();

            // Load categories for current transaction type
            await LoadCategoriesAsync();
        });
    }

    /// <summary>
    /// Load categories filtered by transaction type.
    /// </summary>
    private async Task LoadCategoriesAsync()
    {
        var categories = await _databaseService.GetCategoriesByTypeAsync(SelectedType);
        Categories = new ObservableCollection<Category>(categories);
        
        // Reset selected category if it doesn't match new type
        if (SelectedCategory != null && SelectedCategory.Type != SelectedType)
        {
            SelectedCategory = Categories.FirstOrDefault();
        }
        else if (SelectedCategory == null)
        {
            SelectedCategory = Categories.FirstOrDefault();
        }
    }

    /// <summary>
    /// Load an existing transaction for editing.
    /// </summary>
    private async Task LoadTransactionAsync(int id)
    {
        await ExecuteAsync(async () =>
        {
            var transaction = await _databaseService.GetByIdAsync<Transaction>(id);
            if (transaction != null)
            {
                SelectedType = transaction.Type;
                IsIncome = transaction.Type == TransactionType.Income;
                Amount = transaction.Amount;
                Description = transaction.Description;
                Notes = transaction.Notes ?? string.Empty;
                Date = transaction.Date;

                // Load data first, then set selected items
                await LoadDataAsync();

                SelectedCategory = Categories.FirstOrDefault(c => c.Id == transaction.CategoryId);
                SelectedAccount = Accounts.FirstOrDefault(a => a.Id == transaction.AccountId);
            }
        });
    }

    /// <summary>
    /// Helper to show alerts.
    /// </summary>
    private async Task<bool> ShowAlertAsync(string title, string message, string accept, string? cancel = null)
    {
        var page = Application.Current?.Windows.FirstOrDefault()?.Page;
        if (page == null) return false;

        if (cancel != null)
            return await page.DisplayAlertAsync(title, message, accept, cancel);
        
        await page.DisplayAlertAsync(title, message, accept);
        return true;
    }

    /// <summary>
    /// Save the transaction (create or update).
    /// </summary>
    private async Task SaveAsync()
    {
        // Validation
        if (Amount <= 0)
        {
            await ShowAlertAsync("Validation Error", "Please enter an amount greater than 0.", "OK");
            return;
        }

        if (string.IsNullOrWhiteSpace(Description))
        {
            await ShowAlertAsync("Validation Error", "Please enter a description.", "OK");
            return;
        }

        if (SelectedCategory == null)
        {
            await ShowAlertAsync("Validation Error", "Please select a category.", "OK");
            return;
        }

        await ExecuteAsync(async () =>
        {
            var transaction = new Transaction
            {
                Type = SelectedType,
                Amount = Amount,
                Description = Description.Trim(),
                Notes = string.IsNullOrWhiteSpace(Notes) ? null : Notes.Trim(),
                Date = Date,
                CategoryId = SelectedCategory.Id,
                AccountId = SelectedAccount?.Id
            };

            if (IsEditMode && TransactionId.HasValue)
            {
                transaction.Id = TransactionId.Value;
                await _databaseService.UpdateAsync(transaction);
            }
            else
            {
                await _databaseService.InsertAsync(transaction);
            }

            await _navigationService.GoBackAsync();
        });
    }

    /// <summary>
    /// Cancel and go back.
    /// </summary>
    private async Task CancelAsync()
    {
        await _navigationService.GoBackAsync();
    }
}
