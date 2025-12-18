namespace OneFinance.Services;

public class NavigationService : INavigationService
{
    private readonly Stack<(string ViewName, object? Parameter)> _navigationStack = new();
    private string _currentView = "Dashboard";
    private object? _currentParameter;

    public string CurrentView => _currentView;
    public bool CanGoBack => _navigationStack.Count > 0;
    public event Action<string>? NavigationChanged;

    public void NavigateTo(string viewName, object? parameter = null)
    {
        if (viewName == _currentView)
        {
            _currentParameter = parameter;
            NavigationChanged?.Invoke(viewName);
            return;
        }

        if (!string.IsNullOrEmpty(_currentView))
            _navigationStack.Push((_currentView, _currentParameter));

        _currentView = viewName;
        _currentParameter = parameter;
        NavigationChanged?.Invoke(viewName);
    }

    public object? GetCurrentParameter() => _currentParameter;

    public void GoBack()
    {
        if (_navigationStack.Count > 0)
        {
            var (viewName, parameter) = _navigationStack.Pop();
            _currentView = viewName;
            _currentParameter = parameter;
            NavigationChanged?.Invoke(viewName);
        }
    }
}
