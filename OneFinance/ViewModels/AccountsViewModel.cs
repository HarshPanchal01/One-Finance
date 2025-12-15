using CommunityToolkit.Mvvm.ComponentModel;
using OneFinance.Models;
using OneFinance.Services;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace OneFinance.ViewModels
{
    public partial class AccountsViewModel : ViewModelBase
    {

        private readonly IDatabaseService _databaseService;
        private readonly INavigationService _navigationService;

        [ObservableProperty] private string title = "Accounts";
        [ObservableProperty] private ObservableCollection<Account> _Accounts = new();

        public AccountsViewModel(IDatabaseService databaseService, INavigationService navigationService)
        {
            _databaseService = databaseService;
            _navigationService = navigationService;
        }


    }
    
}
