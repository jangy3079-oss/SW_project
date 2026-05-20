Set-Location C:\SW_Project
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'


$existingUserId = & $mysql -u root -p1234 -N -B -e "USE donga_dating; SELECT user_id FROM users ORDER BY user_id LIMIT 1;"
if (-not $existingUserId) {
  & $mysql -u root -p1234 -e @'
USE donga_dating;
INSERT INTO users (
  email, password, name, gender, birth_date, student_id, department, grade, bio,
  preferences, rank_score, rank_tier, eval_count, email_verified, is_active
) VALUES (
  'pref-test@donga.ac.kr',
  'pref-test-password',
  'Preference Test',
  'MALE',
  '2000-01-01',
  '20260001',
  'Computer Science',
  4,
  'test bio',
  NULL,
  0.00,
  'BRONZE',
  0,
  FALSE,
  TRUE
);
'@
  $existingUserId = & $mysql -u root -p1234 -N -B -e "USE donga_dating; SELECT user_id FROM users WHERE email='pref-test@donga.ac.kr' LIMIT 1;"
}
$userId = [int]$existingUserId.Trim()
Write-Output "USER_ID=$userId"

$running = (netstat -ano | Select-String ':8080')
if (-not $running) {
  $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
  $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
  Start-Process -FilePath ".\gradlew.bat" -ArgumentList "bootRun" -WorkingDirectory "C:\SW_Project" -NoNewWindow
  Start-Sleep -Seconds 18
}

$before = Invoke-RestMethod -Uri "http://localhost:8080/api/users/$userId/preferences" -Method Get -TimeoutSec 10
Write-Output ("BEFORE=" + ($before | ConvertTo-Json -Depth 6 -Compress))

$body = @{
  preferences = @{
    smoking = 'no_smoke'
    drinking = 'moderate'
    culture = 'movie'
    commute = 'strong'
    contact = 'fast_reply'
  }
} | ConvertTo-Json -Depth 6

$updated = Invoke-RestMethod -Uri "http://localhost:8080/api/users/$userId/preferences" -Method Put -ContentType 'application/json' -Body $body -TimeoutSec 10
Write-Output ("UPDATED=" + ($updated | ConvertTo-Json -Depth 6 -Compress))

$after = Invoke-RestMethod -Uri "http://localhost:8080/api/users/$userId/preferences" -Method Get -TimeoutSec 10
Write-Output ("AFTER=" + ($after | ConvertTo-Json -Depth 6 -Compress))

$dbCheck = & $mysql -u root -p1234 -N -B -e "USE donga_dating; SELECT preferences FROM users WHERE user_id=$userId;"
Write-Output ("DB=" + $dbCheck.Trim())
