param (
    [string]$RenderUrl
)

if ([string]::IsNullOrEmpty($RenderUrl)) {
    $RenderUrl = Read-Host "Enter your Render backend URL (e.g., https://ikonex-backend.onrender.com)"
}

# Clean trailing slash from URL
$RenderUrl = $RenderUrl.TrimEnd('/')

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Testing Render Backend: $RenderUrl" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Test Ping / Get Streams
Write-Host "`n[1/3] Testing GET /api/streams..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$RenderUrl/api/streams" -Method Get -ContentType "application/json"
    Write-Host "SUCCESS: Connection established!" -ForegroundColor Green
    Write-Host "Current Streams count: $($response.Count)" -ForegroundColor Green
    Write-Host "Response body:" -ForegroundColor Gray
    $response | ConvertTo-Json | Write-Host -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to connect to GET /api/streams" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 2. Test Creating a Stream
Write-Host "`n[2/3] Testing POST /api/streams..." -ForegroundColor Yellow
$randomName = "Test Stream " + (Get-Random -Minimum 100 -Maximum 999)
$body = @{ name = $randomName } | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "$RenderUrl/api/streams" -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCCESS: Created stream successfully!" -ForegroundColor Green
    Write-Host "Created Stream Details:" -ForegroundColor Green
    $postResponse | ConvertTo-Json | Write-Host -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to create stream" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 3. Verify the Stream is listed
Write-Host "`n[3/3] Fetching all streams to verify insertion..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$RenderUrl/api/streams" -Method Get -ContentType "application/json"
    $insertedStream = $verifyResponse | Where-Object { $_.name -eq $randomName }
    if ($insertedStream) {
        Write-Host "SUCCESS: Stream '$randomName' verified in the list!" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Stream '$randomName' not found in database!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to fetch streams for verification" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host " Test Execution Completed!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
