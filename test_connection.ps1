$url = "https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/manage-employee"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4"

$headers = @{
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
}

$body = @{
    action = "diagnose"
} | ConvertTo-Json

try {
    Write-Host "Testing Edge Function Connectivity..."
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Success! Response:" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $details = $reader.ReadToEnd()
        Write-Host "Details: $details" -ForegroundColor Yellow
    }
}
