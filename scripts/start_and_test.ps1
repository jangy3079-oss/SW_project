Set-Location C:\SW_Project
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
Write-Output "JAVA_HOME=$env:JAVA_HOME"
netstat -ano | findstr :8080
Start-Process -FilePath ".\gradlew.bat" -ArgumentList "bootRun" -WorkingDirectory "C:\SW_Project" -NoNewWindow
Start-Sleep -Seconds 18
$ok = $false
for ($i=0; $i -lt 6; $i++) {
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:8080/api/preferences/template' -Method Get -TimeoutSec 10
    $r | ConvertTo-Json -Depth 6 | Out-File -FilePath build_bootrun_response.json -Encoding utf8
    Write-Output "ENDPOINT_OK"
    $ok = $true
    break
  } catch { Write-Output ('TRY ' + $i + ': ' + $_.Exception.Message); Start-Sleep -Seconds 4 }
}
Get-Content -Path build_bootrun.log -Tail 120 | Out-File -FilePath build_bootrun_log_tail.txt -Encoding utf8
if ($ok) {
  $net = netstat -ano | Select-String ':8080'
  if ($net) {
    $targetPid = ($net -split '\s+')[-1]
    Stop-Process -Id ([int]$targetPid) -Force -ErrorAction SilentlyContinue
    Write-Output "STOPPED_PID=$targetPid"
  }
} else {
  Write-Output "ENDPOINT_FAILED"
}
