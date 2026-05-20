Set-Location C:\SW_Project
$ErrorActionPreference = 'Stop'

$serverStarted = $false
try {
  Invoke-RestMethod -Uri 'http://localhost:8080/api/preferences/template' -Method Get -TimeoutSec 3 | Out-Null
} catch {
  $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
  $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
  Start-Process -FilePath ".\gradlew.bat" -ArgumentList "bootRun" -WorkingDirectory "C:\SW_Project" -NoNewWindow
  $serverStarted = $true
  for ($i = 0; $i -lt 12; $i++) {
    try {
      Invoke-RestMethod -Uri 'http://localhost:8080/api/preferences/template' -Method Get -TimeoutSec 3 | Out-Null
      break
    } catch {
      Start-Sleep -Seconds 3
    }
  }
}

$tmp1 = Join-Path $env:TEMP 'copilot-photo-a.png'
$tmp2 = Join-Path $env:TEMP 'copilot-photo-b.png'
[IO.File]::WriteAllBytes($tmp1, [byte[]](137,80,78,71,13,10,26,10,0,0,0,0))
[IO.File]::WriteAllBytes($tmp2, [byte[]](137,80,78,71,13,10,26,10,1,1,1,1))

Write-Output ("TMP1=" + $tmp1)
Write-Output ("TMP2=" + $tmp2)

$upload1 = (& curl.exe -s -X POST -F "file=@$tmp1;type=image/png" "http://localhost:8080/api/users/1/photos") | ConvertFrom-Json
$upload2 = (& curl.exe -s -X POST -F "file=@$tmp2;type=image/png" "http://localhost:8080/api/users/1/photos") | ConvertFrom-Json
Write-Output ("UPLOAD1=" + ($upload1 | ConvertTo-Json -Depth 6 -Compress))
Write-Output ("UPLOAD2=" + ($upload2 | ConvertTo-Json -Depth 6 -Compress))

$listBefore = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1/photos' -Method Get -TimeoutSec 10
Write-Output ("LIST_BEFORE=" + ($listBefore | ConvertTo-Json -Depth 6 -Compress))

$secondId = $upload2.data.photoId
$patch = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1/photos/$secondId/primary" -Method Patch -TimeoutSec 10
Write-Output ("PATCH=" + ($patch | ConvertTo-Json -Depth 6 -Compress))

$deleteId = $upload1.data.photoId
$delete = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1/photos/$deleteId" -Method Delete -TimeoutSec 10
Write-Output ("DELETE=" + ($delete | ConvertTo-Json -Depth 6 -Compress))

$listAfter = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1/photos' -Method Get -TimeoutSec 10
Write-Output ("LIST_AFTER=" + ($listAfter | ConvertTo-Json -Depth 6 -Compress))

if ($serverStarted) {
  $serverPid = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
  if ($serverPid) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    Write-Output ("STOPPED_PID=" + $serverPid)
  }
}

Remove-Item $tmp1, $tmp2 -Force -ErrorAction SilentlyContinue
