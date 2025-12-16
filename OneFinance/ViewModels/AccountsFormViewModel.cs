using CommunityToolkit.Mvvm.ComponentModel;
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

        public AccountsFormViewModel(IDatabaseService databaseService, INavigationService navigationService)
        {

        }
    }
}
