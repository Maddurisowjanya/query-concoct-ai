# Script to update Gemini API Key
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

if ($ApiKey -eq "placeholder_key_replace_with_real_api_key" -or $ApiKey.Length -lt 20) {
    Write-Host "❌ Please provide a valid Gemini API key" -ForegroundColor Red
    Write-Host "Get your key from: https://ai.google.dev/" -ForegroundColor Yellow
    exit 1
}

$envFile = ".env.local"
$content = Get-Content $envFile -Raw

# Replace the placeholder API key
$newContent = $content -replace "VITE_GEMINI_API_KEY=placeholder_key_replace_with_real_api_key", "VITE_GEMINI_API_KEY=$ApiKey"

# Write back to file
Set-Content -Path $envFile -Value $newContent

Write-Host "✅ API key updated successfully!" -ForegroundColor Green
Write-Host "🚀 Restart your dev server (npm run dev) to use real AI responses" -ForegroundColor Cyan
Write-Host "📍 API key length: $($ApiKey.Length) characters" -ForegroundColor Gray