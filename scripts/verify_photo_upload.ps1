Set-Location C:\SW_Project
$ErrorActionPreference = 'Stop'
$tmp = Join-Path $env:TEMP 'copilot-photo-test.png'
[IO.File]::WriteAllBytes($tmp, [byte[]](137,80,78,71,13,10,26,10,0,0,0,0))
Write-Output ("TMP=" + $tmp)

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

$before = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1/photos' -Method Get -TimeoutSec 10
Write-Output ("BEFORE=" + ($before | ConvertTo-Json -Depth 6 -Compress))

$uploadJson = & curl.exe -s -X POST -F "file=@$tmp;type=image/png" "http://localhost:8080/api/users/1/photos"
Write-Output ("UPLOAD_RAW=" + $uploadJson)
$upload = $uploadJson | ConvertFrom-Json
Write-Output ("UPLOAD=" + ($upload | ConvertTo-Json -Depth 6 -Compress))

$photoId = $upload.data.photoId
$after = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1/photos' -Method Get -TimeoutSec 10
Write-Output ("AFTER=" + ($after | ConvertTo-Json -Depth 6 -Compress))

if ($photoId) {
  $delete = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1/photos/$photoId" -Method Delete -TimeoutSec 10
  Write-Output ("DELETE=" + ($delete | ConvertTo-Json -Depth 6 -Compress))
}

Remove-Item $tmp -Force -ErrorAction SilentlyContinue

if ($serverStarted) {
  $serverPid = (Get-NetTCPConnection -LocalPort 8080 -State Listen | Select-Object -First 1 -ExpandProperty OwningProcess)
  if ($serverPid) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    Write-Output ("STOPPED_PID=" + $serverPid)
  }
}
