using Avalonia;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OneFinance.Models;
using OneFinance.Services;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace OneFinance.ViewModels
{
    public partial class AccountsFormViewModel : ViewModelBase
    {
        private readonly IDatabaseService _databaseService;
        private readonly INavigationService _navigationService;
        private int? _editingId;

        [ObservableProperty] private AccountType _selectedAccountType = AccountType.Chequing;
        public ObservableCollection<AccountType> AccountTypes { get; } =
        new ObservableCollection<AccountType>((AccountType[])Enum.GetValues(typeof(AccountType)));

        [ObservableProperty] private string _accountName;
        [ObservableProperty] private string _institutionName;
        [ObservableProperty] private decimal _balance;
        [ObservableProperty] private bool _isDefault = false;
        [ObservableProperty] private bool _isEditMode;
        

        public AccountsFormViewModel(IDatabaseService databaseService, INavigationService navigationService)
        {
            _databaseService = databaseService;
            _navigationService = navigationService;
            Title = "Add Account";
        }

        public override async Task OnAppearingAsync()
        {
            var param = _navigationService.GetCurrentParameter();
            if (param != null && param is int id) {
                _editingId = id;
                IsEditMode = true;
                Title = "Edit Account";
                var t = await _databaseService.GetAccountByIdAsync(id);
                if (t != null)
                {
                    AccountName = t.Name;
                    InstitutionName = t.Name;
                    Balance = t.Balance;
                    IsDefault = t.IsDefault;
                    SelectedAccountType = t.Type;
                }

            
            }
            await base.OnAppearingAsync();
        }

        public string SaveButtonText => IsEditMode ? "Update" : "Save";
        partial void OnIsEditModeChanged(bool value) => OnPropertyChanged(nameof(SaveButtonText));

        [RelayCommand]
        private void Cancel() => _navigationService.GoBack();

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (AccountName == null || InstitutionName == null) { ErrorMessage = "Enter valid name and instituition"; return; }
            await ExecuteAsync(async () =>
            {

                if (IsEditMode && _editingId != null)
                {
                    var b = await _databaseService.GetAccountByIdAsync((int)_editingId);
                    b.Balance = Balance;
                    b.IsDefault = IsDefault;
                    b.Institution = InstitutionName;
                    b.StartingBalance = Balance;
                    b.Name = InstitutionName;
                    b.Type = SelectedAccountType;

                    await _databaseService.UpdateAsync(b);
                    _navigationService.GoBack();
                    return;
                }

                var t = new Account
                {
                    Name=AccountName,
                    Institution=InstitutionName,
                    Balance=Balance,
                    StartingBalance=Balance,
                    Type=SelectedAccountType,
                    IsDefault=IsDefault,
                };
                
                if (IsDefault) await _databaseService.RemoveCurrentDefaultAccountAsync();
                await _databaseService.InsertAsync(t);
                _navigationService.GoBack();
            });
        }


    }
}
