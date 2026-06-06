using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.DTOs.Auth;
using IKONEX_Academy.Services;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IkonexDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public AuthController(IkonexDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Username == dto.Username);
            if (admin == null || !_passwordHasher.VerifyPassword(dto.Password, admin.PasswordHash))
            {
                Console.WriteLine($"[SECURITY WARNING] Failed login attempt for user '{dto.Username}'");
                return Unauthorized(new { error = "Invalid username or password." });
            }

            // Generate JWT Token
            var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "YourSuperSecretKeyForIkonexAcademy2026!KeepItSecure";
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtSecret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, admin.Username),
                    new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            Console.WriteLine($"[SECURITY INFO] Successful login for user '{admin.Username}'");

            return Ok(new
            {
                token = tokenString,
                username = admin.Username
            });
        }

        [HttpPost("register")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Register([FromBody] RegisterAdminDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exists = await _context.Admins.AnyAsync(a => a.Username == dto.Username);
            if (exists)
            {
                return BadRequest(new { error = $"Username '{dto.Username}' is already taken." });
            }

            var newAdmin = new Admin
            {
                Id = Guid.NewGuid(),
                Username = dto.Username,
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow
            };

            _context.Admins.Add(newAdmin);
            await _context.SaveChangesAsync();

            var currentAdmin = User.Identity?.Name ?? "system";
            Console.WriteLine($"[AUDIT INFO] Admin '{currentAdmin}' registered new admin '{dto.Username}'");

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = currentAdmin,
                Action = $"Registered new admin account '{dto.Username}'",
                EntityId = newAdmin.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Admin account registered successfully.",
                username = newAdmin.Username
            });
        }
    }
}
