# Test manuel de l'API didit

$DIDIT_API_KEY = "TliHFf33s8pcOyEU5ZKJ4jZG_c9JmRxItOSG9m1amuE"
$DIDIT_WORKFLOW_ID = "ee654d15-974a-4a42-8461-e9d98da94ac6"

Write-Host "Test de l'API didit..." -ForegroundColor Cyan
Write-Host ""

# Vérification des paramètres
if ([string]::IsNullOrWhiteSpace($DIDIT_API_KEY)) {
    Write-Host "ERREUR: DIDIT_API_KEY n'est pas definie!" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($DIDIT_WORKFLOW_ID)) {
    Write-Host "ERREUR: DIDIT_WORKFLOW_ID n'est pas definie!" -ForegroundColor Red
    exit 1
}

# Afficher les paramètres (masquer l'API Key)
$maskedKey = if ($DIDIT_API_KEY.Length -gt 8) {
    $DIDIT_API_KEY.Substring(0, 4) + "..." + $DIDIT_API_KEY.Substring($DIDIT_API_KEY.Length - 4)
} else {
    "***"
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  API Key: $maskedKey" -ForegroundColor Gray
Write-Host "  Workflow ID: $DIDIT_WORKFLOW_ID" -ForegroundColor Gray

# Vérifier le format de l'API Key
if (-not $DIDIT_API_KEY.StartsWith("sk_") -and -not $DIDIT_API_KEY.StartsWith("pk_")) {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "ATTENTION: L'API Key ne commence pas par 'sk_' ou 'pk_'" -ForegroundColor Yellow
    Write-Host "  Les API Keys didit commencent generalement par 'sk_' (secret key)" -ForegroundColor DarkYellow
    Write-Host "  Verifie que tu as copie la clé COMPLETE depuis le dashboard didit" -ForegroundColor DarkYellow
}

Write-Host ""

# Payload de test
$body = @{
    workflow_id = $DIDIT_WORKFLOW_ID
    vendor_data = "test_user_123"
} | ConvertTo-Json

Write-Host "Envoi de la requete a didit..." -ForegroundColor Gray
Write-Host "Endpoint: https://verification.didit.me/v3/session/" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "https://verification.didit.me/v3/session/" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $DIDIT_API_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "SUCCESS !" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reponse:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White

} catch {
    $statusCode = $null
    $errorBody = ""
    
    # Essayer de récupérer le status code
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        # Lire le corps de l'erreur si disponible
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $errorBody = $reader.ReadToEnd()
                $reader.Close()
                $stream.Close()
            }
        } catch {
            $errorBody = "Impossible de lire le corps de l'erreur: $($_.Exception.Message)"
        }
    } else {
        $statusCode = "N/A"
        $errorBody = $_.Exception.Message
    }

    Write-Host "ERREUR" -ForegroundColor Red
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    Write-Host ""

    Write-Host "Details de l'erreur:" -ForegroundColor Yellow
    if ($errorBody) {
        Write-Host $errorBody -ForegroundColor White
    } else {
        Write-Host "(Aucun detail disponible)" -ForegroundColor Gray
    }
    Write-Host ""

    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "Suggestions:" -ForegroundColor Cyan
        Write-Host "1. Verifie que l'API Key est complete et correcte" -ForegroundColor Gray
        Write-Host "   - Va sur https://business.didit.me → Settings → API Keys" -ForegroundColor DarkGray
        Write-Host "   - Copie la clé COMPLETE (commence souvent par 'sk_' ou 'pk_')" -ForegroundColor DarkGray
        Write-Host "2. Verifie que l'API Key a les bonnes permissions" -ForegroundColor Gray
        Write-Host "   - L'API Key doit avoir accès au workflow $DIDIT_WORKFLOW_ID" -ForegroundColor DarkGray
        Write-Host "3. Verifie que ton compte didit est actif" -ForegroundColor Gray
        Write-Host "4. Verifie que tu utilises la bonne API Key (test vs production)" -ForegroundColor Gray
        Write-Host "5. Le payload pourrait etre incomplet - l'API didit peut requerir des documents" -ForegroundColor Yellow
    }

    if ($statusCode -eq 400) {
        Write-Host "Suggestions:" -ForegroundColor Cyan
        Write-Host "1. Verifie que le Workflow ID est correct" -ForegroundColor Gray
        Write-Host "2. Verifie que le workflow est active/publie" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Notes:" -ForegroundColor Cyan
Write-Host "- Si erreur 401/403 : Probleme d'authentification (API Key)" -ForegroundColor Gray
Write-Host "- Si erreur 400 : Probleme de donnees (Workflow ID)" -ForegroundColor Gray
Write-Host "- Si erreur 404 : Endpoint incorrect" -ForegroundColor Gray
