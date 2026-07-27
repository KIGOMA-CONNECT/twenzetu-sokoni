# afriMarket Database Backup Script (PowerShell)
# Usage: .\scripts\backup-db.ps1 [output-dir]

param(
  [string]$OutputDir = ""
)

$ScriptDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ScriptDir ".env.production"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
  }
}

$DbHost = [Environment]::GetEnvironmentVariable("DB_HOST", "Process") ?? "localhost"
$DbPort = [Environment]::GetEnvironmentVariable("DB_PORT", "Process") ?? "5434"
$DbName = [Environment]::GetEnvironmentVariable("DB_NAME", "Process") ?? "afri_market"
$DbUser = [Environment]::GetEnvironmentVariable("DB_RUNTIME_USER", "Process") ?? "afri_runtime"
$DbPass = [Environment]::GetEnvironmentVariable("DB_RUNTIME_PASSWORD", "Process") ?? "afri_runtime_dev_password"
$RetentionDays = 30
$S3Bucket = [Environment]::GetEnvironmentVariable("BACKUP_S3_BUCKET", "Process")

if (-not $OutputDir) { $OutputDir = Join-Path $ScriptDir "backups" }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Filename = "afri_market_${Timestamp}.sql.gz"
$FilePath = Join-Path $OutputDir $Filename

Write-Host "Backing up $DbName on $DbHost`:$DbPort -> $FilePath"

$env:PGPASSWORD = $DbPass
$dumpFile = $FilePath -replace '\.gz$', ''

& pg_dump --host="$DbHost" --port="$DbPort" --username="$DbUser" --dbname="$DbName" --no-owner --no-acl --format=custom --file="$dumpFile" --verbose
if ($LASTEXITCODE -ne 0) {
  Write-Error "Backup failed!"
  exit 1
}

& gzip -f "$dumpFile"
Write-Host "Backup complete: $FilePath"

# Rotate old backups
Get-ChildItem -Path $OutputDir -Filter "afri_market_*.sql.gz" | Where-Object {
  $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
} | Remove-Item -Force
Write-Host "Removed backups older than $RetentionDays days"

if ($S3Bucket) {
  Write-Host "Uploading to s3://${S3Bucket}/"
  & aws s3 cp "$FilePath" "s3://${S3Bucket}/database/" --storage-class STANDARD_IA 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "S3 upload failed"
  }
}
