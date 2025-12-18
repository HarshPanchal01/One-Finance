using OneFinance.Models;

namespace OneFinance.Services;

public interface IDatabaseService
{
    Task InitializeAsync();
    Task<List<T>> GetAllAsync<T>() where T : BaseEntity, new();
    Task<T?> GetByIdAsync<T>(int id) where T : BaseEntity, new();
    Task<int> InsertAsync<T>(T entity) where T : BaseEntity, new();
    Task<int> UpdateAsync<T>(T entity) where T : BaseEntity, new();
    Task<int> DeleteAsync<T>(T entity) where T : BaseEntity, new();
    Task<List<Transaction>> GetTransactionsWithDetailsAsync(int? year = null, int? month = null);
    Task<List<Transaction>> GetTransactionsByMonthAsync(int year, int month);
    Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type);
    Task<List<LedgerPeriod>> GetLedgerPeriodsAsync();
    Task<List<LedgerMonth>> GetLedgerMonthsAsync(int? year = null);
    Task<LedgerPeriod> AddLedgerYearAsync(int year);
    Task<LedgerMonth> AddLedgerMonthAsync(int year, int month);
    Task DeleteLedgerYearAsync(int year);
    Task UpdateLedgerExpandedStateAsync(int year, bool isExpanded);
}
