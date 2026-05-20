Set-Location C:\SW_Project
$ErrorActionPreference = 'Stop'
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'

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

$before = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1' -Method Get -TimeoutSec 10
Write-Output ("BEFORE=" + ($before | ConvertTo-Json -Depth 6 -Compress))

$body = @{
  name = 'Profile Test User'
  gender = 'MALE'
  birthDate = '2000-01-01'
  studentId = '20260001'
  department = 'Computer Science'
  grade = 4
  bio = 'profile updated from test'
} | ConvertTo-Json -Depth 6

$updated = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1/profile' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 10
Write-Output ("UPDATED=" + ($updated | ConvertTo-Json -Depth 6 -Compress))

$after = Invoke-RestMethod -Uri 'http://localhost:8080/api/users/1' -Method Get -TimeoutSec 10
Write-Output ("AFTER=" + ($after | ConvertTo-Json -Depth 6 -Compress))

$dbRow = & $mysql -u root -p1234 -N -B -e "USE donga_dating; SELECT name, student_id, department, grade, bio FROM users WHERE user_id=1;"
Write-Output ("DB=" + $dbRow.Trim())

if ($serverStarted) {
  $serverPid = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
  if ($serverPid) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    Write-Output ("STOPPED_PID=" + $serverPid)
  }
}
