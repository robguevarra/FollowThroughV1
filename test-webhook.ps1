# Test WhatsApp Webhook POST Endpoint
# Run this in PowerShell to test the message webhook

$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            changes = @(
                @{
                    field = "messages"
                    value = @{
                        messages = @(
                            @{
                                from = "639498683554"
                                type = "text"
                                id = "test_msg_123"
                                timestamp = "1234567890"
                                text = @{
                                    body = "I completed the task"
                                }
                            }
                        )
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Testing WhatsApp webhook POST endpoint..." -ForegroundColor Cyan
Write-Host "Sending test message payload..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/webhook/whatsapp" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "✗ Failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
