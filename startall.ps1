# Get the root directory of the script
$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($rootPath)) {
    $rootPath = Get-Location
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Starting IKONEX Academy Student Portal" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Launch Backend API in a separate window
Write-Host "--> Starting ASP.NET Core API Backend..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; Write-Host 'Booting backend...'; dotnet run" -WindowStyle Normal

# Launch Frontend Client in a separate window
Write-Host "--> Starting React Vite Frontend Client..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$rootPath/frontend'; Write-Host 'Booting frontend...'; npm run dev" -WindowStyle Normal

Write-Host "---------------------------------------------" -ForegroundColor Cyan
Write-Host "Both servers launched successfully in new windows!" -ForegroundColor Yellow
Write-Host "Press enter to close this control window." -ForegroundColor Cyan
Read-Host
