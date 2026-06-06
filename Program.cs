using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Middleware;
using IKONEX_Academy.Services;
using System.IO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using IKONEX_Academy.Entities;
using Microsoft.OpenApi;


// Load environment variables from .env file if it exists in the project root
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith("#")) continue;
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim();
            if (val.StartsWith("\"") && val.EndsWith("\"")) val = val[1..^1];
            if (val.StartsWith("'") && val.EndsWith("'")) val = val[1..^1];
            Environment.SetEnvironmentVariable(key, val);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// Configure dynamic port binding for cloud deployments if PORT environment variable is set
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}

// Add services to the container.
builder.Services.AddControllers();

// Register Custom Services
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IScoreService, ScoreService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();

// Configure JWT Authentication
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "YourSuperSecretKeyForIkonexAcademy2026!KeepItSecure";
var jwtSigningKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtSigningKey),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure EF Core with PostgreSQL
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        // Parse database URL (e.g. postgresql://username:password@host:port/database)
        var formattedUrl = databaseUrl.Replace("postgresql://", "postgres://");
        var uri = new Uri(formattedUrl);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : string.Empty;
        var host = uri.Host;
        var dbPort = uri.Port == -1 ? 5432 : uri.Port;
        var database = uri.AbsolutePath.TrimStart('/');

        connectionString = $"Host={host};Port={dbPort};Database={database};Username={username};Password={password};Trust Server Certificate=True;";
    }
    else
    {
        var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
        var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
        var dbName = Environment.GetEnvironmentVariable("DB_DATABASE");
        var dbUser = Environment.GetEnvironmentVariable("DB_USERNAME");
        var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD");

        if (!string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName) && !string.IsNullOrEmpty(dbUser) && !string.IsNullOrEmpty(dbPass))
        {
            connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPass};";
        }
        else
        {
            connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        }
    }
}

builder.Services.AddDbContext<IkonexDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure Global CORS Policy
var allowedOriginsVar = Environment.GetEnvironmentVariable("ALLOWED_CORS_ORIGINS");
var allowedOrigins = !string.IsNullOrEmpty(allowedOriginsVar)
    ? allowedOriginsVar.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(o => o.Trim().TrimEnd('/'))
                       .ToArray()
    : Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});


// Configure Swagger API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IKONEX Academy API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

var app = builder.Build();

// Automatically apply database migrations on startup for seamless container deployment and seed default admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IkonexDbContext>();
    db.Database.Migrate();

    if (!db.Admins.Any())
    {
        var defaultAdminUsername = Environment.GetEnvironmentVariable("DEFAULT_ADMIN_USERNAME") ?? "admin";
        var defaultAdminPassword = Environment.GetEnvironmentVariable("DEFAULT_ADMIN_PASSWORD") ?? "Admin123!";
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        db.Admins.Add(new Admin
        {
            Id = Guid.NewGuid(),
            Username = defaultAdminUsername,
            PasswordHash = passwordHasher.HashPassword(defaultAdminPassword),
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
    }
}

// Register Custom Global Exception Handling Middleware FIRST in request pipeline
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

// Enable CORS
app.UseCors("AllowAll");

// Enable Swagger UI middleware
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "IKONEX Academy API v1");
    c.RoutePrefix = "swagger";
});


app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
