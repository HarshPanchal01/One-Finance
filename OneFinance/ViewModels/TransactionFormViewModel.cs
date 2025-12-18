using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OneFinance.Models;
using OneFinance.Services;

namespace OneFinance.ViewModels;

public partial class TransactionFormViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;
    private readonly INavigationService _navigationService;
    private int? _editingId;

    [ObservableProperty] private TransactionType _selectedType = TransactionType.Expense;
    [ObservableProperty] private decimal _amount;
    [ObservableProperty] private string _description = string.Empty;
    [ObservableProperty] private DateTimeOffset? _date = DateTimeOffset.Now;
    [ObservableProperty] private Category? _selectedCategory;
    [ObservableProperty] private Account? _selectedAccount;
    [ObservableProperty] private ObservableCollection<Category> _categories = new();
    [ObservableProperty] private ObservableCollection<Account> _accounts = new();
    [ObservableProperty] private bool _isEditMode;

    public bool IsExpenseSelected { get => SelectedType == TransactionType.Expense; set { if (value) SelectedType = TransactionType.Expense; } }
    public bool IsIncomeSelected { get => SelectedType == TransactionType.Income; set { if (value) SelectedType = TransactionType.Income; } }
    public string SaveButtonText => IsEditMode ? "Update" : "Save";

    public TransactionFormViewModel(IDatabaseService databaseService, INavigationService navigationService)
    {
        _databaseService = databaseService;
        _navigationService = navigationService;
        Title = "Add Transaction";
    }

    partial void OnSelectedTypeChanged(TransactionType value)
    {
        OnPropertyChanged(nameof(IsExpenseSelected));
        OnPropertyChanged(nameof(IsIncomeSelected));
        _ = LoadCategoriesAsync();
    }

    partial void OnIsEditModeChanged(bool value) => OnPropertyChanged(nameof(SaveButtonText));

    public override async Task OnAppearingAsync()
    {
        var param = _navigationService.GetCurrentParameter();
        if (param is int id)
        {
            _editingId = id;
            IsEditMode = true;
            Title = "Edit Transaction";
            var t = await _databaseService.GetByIdAsync<Transaction>(id);
            if (t != null)
            {
                SelectedType = t.Type;
                Amount = t.Amount;
                Description = t.Description;
                Date = new DateTimeOffset(t.Date);
            }
        }
        await LoadCategoriesAsync();
        var accounts = await _databaseService.GetAllAsync<Account>();
        Accounts = new ObservableCollection<Account>(accounts);
        SelectedAccount ??= Accounts.FirstOrDefault(a => a.IsDefault) ?? Accounts.FirstOrDefault();
    }

    private async Task LoadCategoriesAsync()
    {
        var cats = await _databaseService.GetCategoriesByTypeAsync(SelectedType);
        Categories = new ObservableCollection<Category>(cats);
        SelectedCategory ??= Categories.FirstOrDefault();
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        if (Amount <= 0 || SelectedCategory == null) { ErrorMessage = "Enter valid amount and category"; return; }
        await ExecuteAsync(async () =>
        {
            var t = new Transaction
            {
                Id = _editingId ?? 0,
                Type = SelectedType,
                Amount = Amount,
                Description = Description,
                Date = Date?.DateTime ?? DateTime.Today,
                CategoryId = SelectedCategory.Id,
                AccountId = SelectedAccount?.Id
            };
            if (IsEditMode)
            {
                if (_editingId != null && SelectedAccount != null)
                {
                    var result = await _databaseService.GetTransactionByIdAsync((int)_editingId);
                    if (result != null)
                    {
                        decimal oldbalanceChange = result.Amount;
                        decimal newBalanceChange = Amount - oldbalanceChange;

                        await _databaseService.UpdateAccountBalanceById(SelectedAccount.Id, newBalanceChange, SelectedType == TransactionType.Income ? true : false);
                    }
                    await _databaseService.UpdateAsync(t);
                    _navigationService.GoBack();
                    return;
                }
                
            }
            if (SelectedAccount != null && !IsEditMode) await _databaseService.UpdateAccountBalanceById(SelectedAccount.Id, Amount, SelectedType == TransactionType.Income ? true : false);
            
            await _databaseService.InsertAsync(t);
            _navigationService.GoBack();

            
        });
    }

    [RelayCommand]
    private void Cancel() => _navigationService.GoBack();
}
