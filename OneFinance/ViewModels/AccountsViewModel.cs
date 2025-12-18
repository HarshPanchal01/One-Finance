using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OneFinance.Models;
using OneFinance.Services;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Text;

namespace OneFinance.ViewModels
{
    public partial class AccountsViewModel : ViewModelBase
    {

        private readonly IDatabaseService _databaseService;
        private readonly INavigationService _navigationService;

        [ObservableProperty] private string title = "Accounts";
        [ObservableProperty] private ObservableCollection<Account> accounts = new ObservableCollection<Account>();

        public AccountsViewModel(IDatabaseService databaseService, INavigationService navigationService)
        {
            _databaseService = databaseService;
            _navigationService = navigationService;
        }

        public override async Task OnAppearingAsync()
        {
            Accounts = new ObservableCollection<Account>(await GetAccountsAsync()); 
            await base.OnAppearingAsync();
            return;
        }

        private async Task<List<Account>> GetAccountsAsync()
        {
            try
            {
                return await _databaseService.GetAccountsAsync();
            }
            catch (Exception ex)
            {
                return new List<Account>();
            }
            
        }

        [RelayCommand]
        private void AddAccount() => _navigationService.NavigateTo("AccountForm");

        [RelayCommand]
        private void EditAccount(Account? t) { if (t != null) _navigationService.NavigateTo("AccountForm", t.Id); }

        [RelayCommand]
        private void DeleteAccount(Account? t) { if (t != null) {

                Accounts.Remove(t);
                _databaseService.DeleteAccountByIdAsync(t.Id);
            } 
        }

    }
    
}
