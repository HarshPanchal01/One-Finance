using ONE_FINANCE.Views;

namespace ONE_FINANCE;

public partial class AppShell : Shell
{
	public AppShell()
	{
		InitializeComponent();

		// Register routes for pages that need programmatic navigation
		// (pages not in the flyout/tab structure)
		RegisterRoutes();
	}

	/// <summary>
	/// Register all routes for navigation.
	/// Add new routes here as you create new pages.
	/// </summary>
	private static void RegisterRoutes()
	{
		// Transaction form page for adding/editing transactions
		Routing.RegisterRoute(AppRoutes.TransactionForm, typeof(TransactionFormPage));
		
		// Future routes:
		// Routing.RegisterRoute(AppRoutes.TransactionDetail, typeof(TransactionDetailPage));
		// Routing.RegisterRoute(AppRoutes.AccountForm, typeof(AccountFormPage));
	}
}
