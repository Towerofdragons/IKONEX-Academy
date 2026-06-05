using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Middleware;
using IKONEX_Academy.Services;
using System.IO;

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

// Configure EF Core with PostgreSQL
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
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

builder.Services.AddDbContext<IkonexDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure Global CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Register Custom Global Exception Handling Middleware FIRST in request pipeline
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

// Enable CORS
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
