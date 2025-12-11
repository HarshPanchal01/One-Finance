using Microsoft.Extensions.Logging;
using ONE_FINANCE.Services;
using ONE_FINANCE.ViewModels;
using ONE_FINANCE.Views;

namespace ONE_FINANCE;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

		// Register Services
		builder.Services.AddSingleton<IDatabaseService, DatabaseService>();
		builder.Services.AddSingleton<INavigationService, NavigationService>();

		// Register ViewModels
		builder.Services.AddTransient<DashboardViewModel>();
		builder.Services.AddTransient<SettingsViewModel>();
		builder.Services.AddTransient<TransactionsViewModel>();
		builder.Services.AddTransient<TransactionFormViewModel>();

		// Register Pages
		builder.Services.AddTransient<DashboardPage>();
		builder.Services.AddTransient<SettingsPage>();
		builder.Services.AddTransient<TransactionsPage>();
		builder.Services.AddTransient<TransactionFormPage>();

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
