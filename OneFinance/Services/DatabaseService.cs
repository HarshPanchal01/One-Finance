using SQLite;
using OneFinance.Models;

namespace OneFinance.Services;

public class DatabaseService : IDatabaseService
{
    private SQLiteAsyncConnection? _database;
    private readonly string _dbPath;

    public DatabaseService()
    {
        var appDataPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "OneFinance");
        Directory.CreateDirectory(appDataPath);
        _dbPath = Path.Combine(appDataPath, "onefinance.db3");
    }

    public async Task InitializeAsync()
    {
        if (_database is not null) return;

        _database = new SQLiteAsyncConnection(_dbPath);
        await _database.CreateTableAsync<Transaction>();
        await _database.CreateTableAsync<Category>();
        await _database.CreateTableAsync<Account>();
        await SeedDefaultDataAsync();
    }

    public async Task<List<T>> GetAllAsync<T>() where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.Table<T>().ToListAsync();
    }

    public async Task<T?> GetByIdAsync<T>(int id) where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.Table<T>().FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<int> InsertAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        entity.CreatedAt = DateTime.UtcNow;
        return await _database!.InsertAsync(entity);
    }

    public async Task<int> UpdateAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        entity.UpdatedAt = DateTime.UtcNow;
        return await _database!.UpdateAsync(entity);
    }

    public async Task<int> DeleteAsync<T>(T entity) where T : BaseEntity, new()
    {
        await InitializeAsync();
        return await _database!.DeleteAsync(entity);
    }

    public async Task<List<Transaction>> GetTransactionsWithDetailsAsync()
    {
        await InitializeAsync();
        var transactions = await _database!.Table<Transaction>().OrderByDescending(t => t.Date).ToListAsync();
        var categories = await _database.Table<Category>().ToListAsync();
        var accounts = await _database.Table<Account>().ToListAsync();

        foreach (var t in transactions)
        {
            t.Category = categories.FirstOrDefault(c => c.Id == t.CategoryId);
            if (t.AccountId.HasValue)
                t.Account = accounts.FirstOrDefault(a => a.Id == t.AccountId.Value);
        }
        return transactions;
    }

    public async Task<List<Transaction>> GetTransactionsByMonthAsync(int year, int month)
    {
        await InitializeAsync();
        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);
        return await _database!.Table<Transaction>()
            .Where(t => t.Date >= start && t.Date < end)
            .OrderByDescending(t => t.Date)
            .ToListAsync();
    }

    public async Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type)
    {
        await InitializeAsync();
        return await _database!.Table<Category>().Where(c => c.Type == type).ToListAsync();
    }

    private async Task SeedDefaultDataAsync()
    {
        if (await _database!.Table<Category>().CountAsync() > 0) return;

        var categories = new[]
        {
            new Category { Name = "Salary", Type = TransactionType.Income, IsSystem = true },
            new Category { Name = "Freelance", Type = TransactionType.Income, IsSystem = true },
            new Category { Name = "Other Income", Type = TransactionType.Income, IsSystem = true },
            new Category { Name = "Food & Dining", Type = TransactionType.Expense, IsSystem = true },
            new Category { Name = "Transportation", Type = TransactionType.Expense, IsSystem = true },
            new Category { Name = "Shopping", Type = TransactionType.Expense, IsSystem = true },
            new Category { Name = "Bills & Utilities", Type = TransactionType.Expense, IsSystem = true },
            new Category { Name = "Entertainment", Type = TransactionType.Expense, IsSystem = true },
        };
        foreach (var c in categories) await _database.InsertAsync(c);

        await _database.InsertAsync(new Account { Name = "Cash", Type = AccountType.Cash, IsDefault = true });
    }

    public async Task<List<Account>> GetAccountsAsync()
    {
        await InitializeAsync();
        return await _database!.Table<Account>().ToListAsync();
    }

    public async Task<Account> GetAccountByIdAsync(int id)
    {
        await InitializeAsync();
        return await _database!.FindAsync<Account>(id);
    }

    public async Task RemoveCurrentDefaultAccountAsync()
    {
        await InitializeAsync();
        var result = await _database!.Table<Account>().Where((t) => t.IsDefault).FirstOrDefaultAsync();
        if (result != null)
        {
            result.IsDefault = false;
            await _database!.UpdateAsync(result);
        }

        return;
    }

    public async Task DeleteAccountByIdAsync(int id)
    {
        await InitializeAsync();
        await _database!.DeleteAsync<Account>(id);
        return;
    }

    public async Task UpdateAccountBalanceById(int id, decimal amount, bool income)
    {
        await InitializeAsync();
        var result = await _database!.FindAsync<Account>(id);
        if (result != null)
        {
            if (!income) amount *= -1;
            result.Balance += amount;
            await _database!.UpdateAsync(result);
        }
    }

    public async Task<Transaction?> GetTransactionByIdAsync(int id)
    {
        await InitializeAsync();
        var result = await _database!.FindAsync<Transaction>(id);
        if (result != null)
        {
            return result;
        }
        else
        {
            return null;
        }
    }
}
