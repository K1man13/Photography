param(
  [string]$Url = 'http://localhost:3000/api/mpesa',
  [string]$Phone = '0712345678',
  [int]$Amount = 100,
  [string]$Ref = 'TestPayment'
)

# Simple PowerShell test script to POST to the mpesa serverless endpoint
# Usage:
#   .\test-mpesa.ps1 -Url 'https://your-site.com/api/mpesa' -Phone '0712345678' -Amount 100 -Ref 'Booking#12'

$body = @{ phone = $Phone; amount = $Amount; ref = $Ref } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
  Write-Host 'Response:' -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host 'Request failed:' -ForegroundColor Red
  if ($_.Exception) {
    $ex = $_.Exception
    Write-Host "Exception: $($ex.Message)" -ForegroundColor Yellow
    if ($ex.Response) {
      try { Write-Host "HTTP StatusCode: $($ex.Response.StatusCode)" } catch {}
      try { $body = $ex.Response.Content.ReadAsStringAsync().Result; Write-Host "Response body:`n$body" } catch { Write-Host "Could not read response body: $($_.Exception.Message)" -ForegroundColor Yellow }
    } else {
      Write-Host "No HTTP response available. Full exception:" -ForegroundColor Yellow
      $ex | Format-List * -Force
    }
  } else {
    Write-Host "Unknown error. Raw output:" -ForegroundColor Yellow
    $_ | Format-List * -Force
  }
}
