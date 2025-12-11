using ONE_FINANCE.Models;

namespace ONE_FINANCE.Services;

/// <summary>
/// Interface for database operations.
/// </summary>
public interface IDatabaseService
{
    /// <summary>
    /// Initializes the database and creates tables if they don't exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Gets all entities of the specified type.
    /// </summary>
    Task<List<T>> GetAllAsync<T>() where T : BaseEntity, new();

    /// <summary>
    /// Gets an entity by its ID.
    /// </summary>
    Task<T?> GetByIdAsync<T>(int id) where T : BaseEntity, new();

    /// <summary>
    /// Inserts a new entity.
    /// </summary>
    Task<int> InsertAsync<T>(T entity) where T : BaseEntity, new();

    /// <summary>
    /// Updates an existing entity.
    /// </summary>
    Task<int> UpdateAsync<T>(T entity) where T : BaseEntity, new();

    /// <summary>
    /// Deletes an entity.
    /// </summary>
    Task<int> DeleteAsync<T>(T entity) where T : BaseEntity, new();

    /// <summary>
    /// Gets all transactions with their Category and Account details loaded.
    /// </summary>
    Task<List<Transaction>> GetTransactionsWithDetailsAsync();

    /// <summary>
    /// Gets categories filtered by transaction type.
    /// </summary>
    Task<List<Category>> GetCategoriesByTypeAsync(TransactionType type);

    /// <summary>
    /// Gets transactions for a specific month.
    /// </summary>
    Task<List<Transaction>> GetTransactionsByMonthAsync(int year, int month);
}
