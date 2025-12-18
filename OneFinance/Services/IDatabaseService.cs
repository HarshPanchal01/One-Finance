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
    Task<List<Transaction>> GetTransactionsWithDetailsAsync();
    Task<List<Transaction>> GetTransactionsByMonthAsync(int year, int month);
    Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type);
    Task<List<Account>> GetAccountsAsync();

    Task<Account> GetAccountByIdAsync(int id);

    Task RemoveCurrentDefaultAccountAsync();

    Task DeleteAccountByIdAsync(int id);

    Task UpdateAccountBalanceById(int id, decimal amount, bool income);

    Task<Transaction?> GetTransactionByIdAsync(int id);
}
