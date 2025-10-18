param(
  [string]$Passkey = $null,
  [string]$MpesaAccountType = 'till',
  [string]$MpesaEnv = 'sandbox',
  [string]$SiteUrl = 'http://localhost:3000',
  [switch]$PushToVercel
)

Write-Host 'MPESA env helper — will set PASSKEY, MPESA_ACCOUNT_TYPE, MPESA_ENV, SITE_URL for this shell and optionally write .env' -ForegroundColor Cyan

if (-not $Passkey) { $Passkey = Read-Host 'PASSKEY (visible)'; }

#$env:PASSKEY = $Passkey
#$env:MPESA_ACCOUNT_TYPE = $MpesaAccountType
#$env:MPESA_ENV = $MpesaEnv
#$env:SITE_URL = $SiteUrl

Write-Host "Setting session variables: MPESA_ACCOUNT_TYPE=$MpesaAccountType, MPESA_ENV=$MpesaEnv, SITE_URL=$SiteUrl" -ForegroundColor Green
$env:PASSKEY = $Passkey
$env:MPESA_ACCOUNT_TYPE = $MpesaAccountType
$env:MPESA_ENV = $MpesaEnv
$env:SITE_URL = $SiteUrl

$envFile = Join-Path -Path (Get-Location) -ChildPath '.env'
if (Test-Path $envFile) {
  $ok = Read-Host '.env exists — overwrite? (y/N)'
  if ($ok -ne 'y' -and $ok -ne 'Y') { Write-Host 'Skipped writing .env' -ForegroundColor Yellow }
  else {
    @"
PASSKEY=$Passkey
MPESA_ACCOUNT_TYPE=$MpesaAccountType
MPESA_ENV=$MpesaEnv
SITE_URL=$SiteUrl
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host '.env written' -ForegroundColor Green
  }
} else {
  @"
PASSKEY=$Passkey
MPESA_ACCOUNT_TYPE=$MpesaAccountType
MPESA_ENV=$MpesaEnv
SITE_URL=$SiteUrl
"@ | Out-File -FilePath $envFile -Encoding UTF8
  Write-Host '.env written' -ForegroundColor Green
}

if ($PushToVercel) {
  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) { Write-Host 'Vercel CLI not found. Install npm i -g vercel' -ForegroundColor Red; return }
  Write-Host 'Pushing to Vercel env (you will be prompted for environment) ...' -ForegroundColor Cyan
  vercel env add PASSKEY $Passkey
  vercel env add MPESA_ACCOUNT_TYPE $MpesaAccountType
  vercel env add MPESA_ENV $MpesaEnv
  vercel env add SITE_URL $SiteUrl
  Write-Host 'Vercel env add done (if project linked & logged in).' -ForegroundColor Green
}