#!/usr/bin/env pwsh
<#
Usage: Run this script to apply schema.sql to local MySQL.
It will try to find mysql.exe, then run it and prompt for password interactively.
#>

Set-StrictMode -Version Latest

$possible = @(
    "$env:ProgramFiles\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "$env:ProgramFiles(x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
)

$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mysqlCmd) {
    $mysqlPath = $mysqlCmd.Source
} else {
    $mysqlPath = $null
    foreach ($p in $possible) { if (Test-Path $p) { $mysqlPath = $p; break } }
}

if (-not $mysqlPath) {
    Write-Error "mysql.exe not found. Please install MySQL client or add it to PATH."
    exit 1
}

$schemaRel = "src\main\resources\schema.sql"
$repoRoot = Split-Path -Parent -Path $PSScriptRoot
$schemaPath = Join-Path $repoRoot $schemaRel

if (-not (Test-Path $schemaPath)) {
    Write-Error "schema.sql not found at $schemaPath"
    exit 1
}

$dbUser = Read-Host "DB user (default: root)"
if (-not $dbUser) { $dbUser = 'root' }

Write-Host "Using mysql: $mysqlPath"
Write-Host "Applying schema: $schemaPath"

Write-Host "The script will now run mysql and prompt for the DB password. Enter password when prompted."

# Use cmd.exe to allow input redirection. Use Start-Process and capture exit code.
$args = "/c `"$mysqlPath`" -u $dbUser -p < `"$schemaPath`""
$proc = Start-Process -FilePath cmd.exe -ArgumentList $args -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -eq 0) {
    Write-Host "Schema import completed successfully."
} else {
    Write-Error "Schema import finished with exit code $($proc.ExitCode)"
}
