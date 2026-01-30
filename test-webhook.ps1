# Test manuel du webhook didit
# Ce script teste si l'Edge Function didit-webhook répond

$url = "https://muhexuopzmqdxonurktn.supabase.co/functions/v1/didit-webhook"

Write-Host "🧪 Test de l'Edge Function didit-webhook..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    # Test simple avec un payload vide
    $body = @{
        session_id = "test_session_123"
        status = "Approved"
        decision = @{
            id_verification = @{
                status = "Approved"
                confidence = 0.95
            }
        }
    } | ConvertTo-Json

    # Appel HTTP POST
    $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -UseBasicParsing

    Write-Host "✅ SUCCESS - La fonction répond !" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray

} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__

    if ($statusCode -eq 401) {
        Write-Host "⚠️  401 Unauthorized - C'est NORMAL pour un test sans signature" -ForegroundColor Yellow
        Write-Host "La fonction est DÉPLOYÉE et répond correctement" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ L'Edge Function fonctionne !" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR - La fonction ne répond pas correctement" -ForegroundColor Red
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Note: Un code 401 est normal car nous n'avons pas la signature HMAC" -ForegroundColor Gray
Write-Host "L'important est que la fonction RÉPONDE (pas 404 ou timeout)" -ForegroundColor Gray
