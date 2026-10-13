using System.Security.Cryptography;
using System.Text;
using Org.BouncyCastle.Crypto.Generators;
namespace RestaurantMvc.Services;
public static class PasswordService
{
    // Giữ tương thích scrypt của bản Node.js: N=16384, r=8, p=1; salt là chuỗi hex UTF-8.
    public static string Hash(string password)
    {
        var salt=Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        return salt+":"+Convert.ToHexString(Derive(password,salt)).ToLowerInvariant();
    }
    private static byte[] Derive(string password,string salt) => SCrypt.Generate(Encoding.UTF8.GetBytes(password),Encoding.UTF8.GetBytes(salt),16384,8,1,64);
    public static bool Verify(string password,string stored)
    {
        var parts=stored.Split(':'); if(parts.Length!=2) return false;
        try { return CryptographicOperations.FixedTimeEquals(Derive(password,parts[0]),Convert.FromHexString(parts[1])); }
        catch(FormatException) { return false; }
    }
}
