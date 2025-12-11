using ONE_FINANCE.ViewModels;

namespace ONE_FINANCE.Views;

public partial class TransactionFormPage : ContentPage
{
    private readonly TransactionFormViewModel _viewModel;

    public TransactionFormPage(TransactionFormViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        
        // Load data when page appears (only if not in edit mode)
        if (!_viewModel.IsEditMode)
        {
            _viewModel.LoadDataCommand.Execute(null);
        }
    }
}
