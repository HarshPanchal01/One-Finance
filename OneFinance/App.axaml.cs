using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Microsoft.Extensions.DependencyInjection;
using OneFinance.Services;
using OneFinance.ViewModels;
using OneFinance.Views;
using System;

namespace OneFinance;

public partial class App : Application
{
    public static IServiceProvider? Services { get; private set; }

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        var services = new ServiceCollection();
        ConfigureServices(services);
        Services = services.BuildServiceProvider();

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var mainViewModel = Services.GetRequiredService<MainWindowViewModel>();
            desktop.MainWindow = new MainWindow
            {
                DataContext = mainViewModel
            };
        }

        base.OnFrameworkInitializationCompleted();
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        // Services
        services.AddSingleton<IDatabaseService, DatabaseService>();
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<ILedgerPeriodContext, LedgerPeriodContext>();

        // ViewModels
        services.AddSingleton<MainWindowViewModel>();
        services.AddTransient<DashboardViewModel>();
        services.AddSingleton<TransactionsViewModel>();
        services.AddTransient<TransactionFormViewModel>();
        services.AddTransient<SettingsViewModel>();

        // ViewModel Factories for MainWindowViewModel
        services.AddSingleton<Func<DashboardViewModel>>(sp => () => sp.GetRequiredService<DashboardViewModel>());
        services.AddSingleton<Func<TransactionsViewModel>>(sp => () => sp.GetRequiredService<TransactionsViewModel>());
        services.AddSingleton<Func<TransactionFormViewModel>>(sp => () => sp.GetRequiredService<TransactionFormViewModel>());
        services.AddSingleton<Func<SettingsViewModel>>(sp => () => sp.GetRequiredService<SettingsViewModel>());
    }
}