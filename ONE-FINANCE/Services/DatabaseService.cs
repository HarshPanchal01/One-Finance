using SQLite;
using ONE_FINANCE.Models;

namespace ONE_FINANCE.Services;

/// <summary>
/// SQLite database service for local data persistence.
/// </summary>
public class DatabaseService : IDatabaseService
{
    private SQLiteAsyncConnection? _database;
    private readonly string _dbPath;

    public DatabaseService()
    {
        _dbPath = Path.Combine(FileSystem.AppDataDirectory, "onefinance.db3");
    }

    /// <inheritdoc/>
    public async Task InitializeAsync()
    {
        if (_database is not null)
            return;

        _database = new SQLiteAsyncConnection(_dbPath, SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache);

        // Create tables for all models
        await _database.CreateTableAsync<Transaction>();
        await _database.CreateTableAsync<Category>();
        await _database.CreateTableAsync<Account>();

        // Seed default data if needed
        await SeedDefaultCategoriesAsync();
        await SeedDefaultAccountAsync();
    }

    /// <inheritdoc/>
    public async Task<List<T>> GetAllAsync<T>() where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.Table<T>().ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<T?> GetByIdAsync<T>(int id) where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.Table<T>().FirstOrDefaultAsync(e => e.Id == id);
    }

    /// <inheritdoc/>
    public async Task<int> InsertAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        entity.CreatedAt = DateTime.UtcNow;
        return await _database!.InsertAsync(entity);
    }

    /// <inheritdoc/>
    public async Task<int> UpdateAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        entity.UpdatedAt = DateTime.UtcNow;
        return await _database!.UpdateAsync(entity);
    }

    /// <inheritdoc/>
    public async Task<int> DeleteAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.DeleteAsync(entity);
    }

    /// <summary>
    /// Gets transactions with their related Category and Account populated.
    /// </summary>
    public async Task<List<Transaction>> GetTransactionsWithDetailsAsync()
    {
        await InitializeAsync();
        
        var transactions = await _database!.Table<Transaction>()
            .OrderByDescending(t => t.Date)
            .ToListAsync();
        
        var categories = await _database.Table<Category>().ToListAsync();
        var accounts = await _database.Table<Account>().ToListAsync();
        
        var categoryDict = categories.ToDictionary(c => c.Id);
        var accountDict = accounts.ToDictionary(a => a.Id);
        
        foreach (var transaction in transactions)
        {
            if (categoryDict.TryGetValue(transaction.CategoryId, out var category))
                transaction.Category = category;
            
            if (transaction.AccountId.HasValue && accountDict.TryGetValue(transaction.AccountId.Value, out var account))
                transaction.Account = account;
        }
        
        return transactions;
    }

    /// <summary>
    /// Gets transactions filtered by month and year.
    /// </summary>
    public async Task<List<Transaction>> GetTransactionsByMonthAsync(int year, int month)
    {
        await InitializeAsync();
        
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);
        
        var transactions = await _database!.Table<Transaction>()
            .Where(t => t.Date >= startDate && t.Date < endDate)
            .OrderByDescending(t => t.Date)
            .ToListAsync();
        
        // Populate navigation properties
        var categories = await _database.Table<Category>().ToListAsync();
        var accounts = await _database.Table<Account>().ToListAsync();
        
        var categoryDict = categories.ToDictionary(c => c.Id);
        var accountDict = accounts.ToDictionary(a => a.Id);
        
        foreach (var transaction in transactions)
        {
            if (categoryDict.TryGetValue(transaction.CategoryId, out var category))
                transaction.Category = category;
            
            if (transaction.AccountId.HasValue && accountDict.TryGetValue(transaction.AccountId.Value, out var account))
                transaction.Account = account;
        }
        
        return transactions;
    }

    /// <summary>
    /// Gets categories filtered by transaction type.
    /// </summary>
    public async Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type)
    {
        await InitializeAsync();
        return await _database!.Table<Category>()
            .Where(c => c.Type == type)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Gets the default account or null if none exists.
    /// </summary>
    public async Task<Account?> GetDefaultAccountAsync()
    {
        await InitializeAsync();
        return await _database!.Table<Account>()
            .FirstOrDefaultAsync(a => a.IsDefault);
    }

    /// <summary>
    /// Seeds default categories for new installations.
    /// </summary>
    private async Task SeedDefaultCategoriesAsync()
    {
        var existingCategories = await _database!.Table<Category>().CountAsync();
        if (existingCategories > 0)
            return;

        var defaultCategories = new List<Category>
        {
            // Income categories
            new() { Name = "Salary", Type = TransactionType.Income, Icon = "💼", IsSystem = true },
            new() { Name = "Freelance", Type = TransactionType.Income, Icon = "💻", IsSystem = true },
            new() { Name = "Investments", Type = TransactionType.Income, Icon = "📈", IsSystem = true },
            new() { Name = "Other Income", Type = TransactionType.Income, Icon = "💰", IsSystem = true },

            // Expense categories
            new() { Name = "Food & Dining", Type = TransactionType.Expense, Icon = "🍔", IsSystem = true },
            new() { Name = "Transportation", Type = TransactionType.Expense, Icon = "🚗", IsSystem = true },
            new() { Name = "Shopping", Type = TransactionType.Expense, Icon = "🛒", IsSystem = true },
            new() { Name = "Entertainment", Type = TransactionType.Expense, Icon = "🎬", IsSystem = true },
            new() { Name = "Bills & Utilities", Type = TransactionType.Expense, Icon = "📄", IsSystem = true },
            new() { Name = "Healthcare", Type = TransactionType.Expense, Icon = "🏥", IsSystem = true },
            new() { Name = "Other Expense", Type = TransactionType.Expense, Icon = "📦", IsSystem = true },
        };

        foreach (var category in defaultCategories)
        {
            category.CreatedAt = DateTime.UtcNow;
            await _database.InsertAsync(category);
        }
    }

    /// <summary>
    /// Seeds a default "Cash" account for new installations.
    /// </summary>
    private async Task SeedDefaultAccountAsync()
    {
        var existingAccounts = await _database!.Table<Account>().CountAsync();
        if (existingAccounts > 0)
            return;

        var defaultAccount = new Account
        {
            Name = "Cash",
            Type = AccountType.Cash,
            Icon = "💵",
            IsDefault = true,
            Balance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _database.InsertAsync(defaultAccount);
    }
}
