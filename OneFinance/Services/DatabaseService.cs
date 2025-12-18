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
        await _database.CreateTableAsync<LedgerPeriod>();
        await _database.CreateTableAsync<LedgerMonth>();
        await SeedDefaultDataAsync();
        await EnsureDefaultPeriodAsync();
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

    public async Task<List<Transaction>> GetTransactionsWithDetailsAsync(int? year = null, int? month = null)
    {
        await InitializeAsync();
        var query = _database!.Table<Transaction>();

        if (year.HasValue)
        {
            var start = new DateTime(year.Value, month ?? 1, 1);
            var end = month.HasValue ? start.AddMonths(1) : new DateTime(year.Value + 1, 1, 1);
            query = query.Where(t => t.Date >= start && t.Date < end);
        }

        var transactions = await query.OrderByDescending(t => t.Date).ToListAsync();
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
        return await GetTransactionsWithDetailsAsync(year, month);
    }

    public async Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type)
    {
        await InitializeAsync();
        return await _database!.Table<Category>().Where(c => c.Type == type).ToListAsync();
    }

    public async Task<List<LedgerPeriod>> GetLedgerPeriodsAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LedgerPeriod>().OrderByDescending(p => p.Year).ToListAsync();
    }

    public async Task<List<LedgerMonth>> GetLedgerMonthsAsync(int? year = null)
    {
        await InitializeAsync();
        var query = _database!.Table<LedgerMonth>();
        if (year.HasValue)
            query = query.Where(m => m.Year == year.Value);

        return await query.OrderBy(m => m.Month).ToListAsync();
    }

    public async Task<LedgerPeriod> AddLedgerYearAsync(int year)
    {
        await InitializeAsync();
        var existing = await _database!.Table<LedgerPeriod>().FirstOrDefaultAsync(p => p.Year == year);
        if (existing is not null) return existing;

        var period = new LedgerPeriod { Year = year, IsExpanded = true };
        await _database.InsertAsync(period);
        for (var m = 1; m <= 12; m++)
        {
            await AddLedgerMonthAsync(year, m);
        }

        return period;
    }

    public async Task<LedgerMonth> AddLedgerMonthAsync(int year, int month)
    {
        await InitializeAsync();
        var clampedMonth = Math.Clamp(month, 1, 12);
        var existing = await _database!.Table<LedgerMonth>().FirstOrDefaultAsync(m => m.Year == year && m.Month == clampedMonth);
        if (existing is not null) return existing;

        var parent = await _database.Table<LedgerPeriod>().FirstOrDefaultAsync(p => p.Year == year);
        if (parent is null)
        {
            await AddLedgerYearAsync(year);
        }

        var ledgerMonth = new LedgerMonth { Year = year, Month = clampedMonth };
        await _database.InsertAsync(ledgerMonth);
        return ledgerMonth;
    }

    public async Task DeleteLedgerYearAsync(int year)
    {
        await InitializeAsync();
        var period = await _database!.Table<LedgerPeriod>().FirstOrDefaultAsync(p => p.Year == year);
        if (period != null)
        {
            await _database.DeleteAsync(period);
        }

        var months = await _database.Table<LedgerMonth>().Where(m => m.Year == year).ToListAsync();
        foreach (var month in months)
        {
            await _database.DeleteAsync(month);
        }

        // Delete all transactions for this year
        var start = new DateTime(year, 1, 1);
        var end = new DateTime(year + 1, 1, 1);
        var transactions = await _database.Table<Transaction>()
            .Where(t => t.Date >= start && t.Date < end)
            .ToListAsync();
            
        foreach (var t in transactions)
        {
            await _database.DeleteAsync(t);
        }
    }

    public async Task UpdateLedgerExpandedStateAsync(int year, bool isExpanded)
    {
        await InitializeAsync();
        var period = await _database!.Table<LedgerPeriod>().FirstOrDefaultAsync(p => p.Year == year);
        if (period is null) return;

        period.IsExpanded = isExpanded;
        await _database.UpdateAsync(period);
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
    private async Task EnsureDefaultPeriodAsync()
    {
        if (await _database!.Table<LedgerPeriod>().CountAsync() > 0) return;
        await AddLedgerYearAsync(DateTime.Now.Year);
    }
}
