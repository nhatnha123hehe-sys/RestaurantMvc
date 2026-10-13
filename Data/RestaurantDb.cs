using Dapper;
using Microsoft.Data.SqlClient;
namespace RestaurantMvc.Data;

// Mỗi request dùng một connection; nghiệp vụ nhiều bước dùng cùng transaction.
public sealed class RestaurantDb(IConfiguration configuration) : IDisposable
{
    private readonly SqlConnection connection = new(configuration.GetConnectionString("Restaurant"));
    private SqlTransaction? transaction;
    public async Task<List<dynamic>> Query(string sql, object? args = null)
    {
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();
        return (await connection.QueryAsync(sql, args, transaction)).ToList();
    }
    public async Task<dynamic> One(string sql, object? args = null)
        => (await Query(sql, args)).FirstOrDefault()!;
    public async Task<T> Atomic<T>(Func<Task<T>> work)
    {
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();
        transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try { var result = await work(); await transaction.CommitAsync(); return result; }
        catch { await transaction.RollbackAsync(); throw; }
        finally { await transaction.DisposeAsync(); transaction = null; }
    }
    public void Dispose() => connection.Dispose();
}
