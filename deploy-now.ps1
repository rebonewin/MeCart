# deploy-now.ps1 — Vercel production deployment for MeCart (Option A).
# Run from C:\Users\HP\MeCart by double-clicking deploy-now.bat (no copy/paste needed).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$cli = "C:\Users\HP\AppData\Local\npm-cache\_npx\67eb4586ca667318\node_modules\vercel\dist\index.js"
if (-not (Test-Path $cli)) { throw "Vercel CLI not found at $cli" }

Write-Host ""
Write-Host "=== Step 1/5 : Verify Vercel login ===" -ForegroundColor Cyan
& $cli whoami
if ($LASTEXITCODE -ne 0) { throw "Not logged in. Run 'vercel login' in your own terminal first; then re-run this script." }

Write-Host ""
Write-Host "=== Step 2/5 : Link to born6/me-cart ===" -ForegroundColor Cyan
if (Test-Path ".vercel\anonymous.json") { Remove-Item ".vercel\anonymous.json" -Force }
& $cli link --project me-cart --scope born6 --yes
if ($LASTEXITCODE -ne 0) { throw "Link failed. Try 'vercel link --yes' manually." }

Write-Host ""
Write-Host "=== Step 3/5 : Environment variables (add missing only, values never echoed) ===" -ForegroundColor Cyan
$required = @("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SITE_URL","ADMIN_EMAIL")
$existing = (& $cli env ls production 2>&1) | Out-String
foreach ($key in $required) {
    if ($existing -match [regex]::Escape($key)) {
        Write-Host "  OK  $key (already set — skipped)" -ForegroundColor Green
    } else {
        Write-Host "  ... $key (adding from .env.local)" -ForegroundColor Yellow
        $line = Get-Content ".env.local" | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
        if (-not $line) { throw "$key missing in .env.local" }
        $val = $line.Substring($key.Length + 1)
        $val | & $cli env add $key production
        if ($LASTEXITCODE -ne 0) { throw "Could not add $key (maybe it exists already -- re-run after 'vercel env rm $key production')" }
        Write-Host "  OK  $key added" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Step 4/5 : Production cloud build + deploy ===" -ForegroundColor Cyan
& $cli deploy --prod --yes
if ($LASTEXITCODE -ne 0) { throw "Deploy failed. Read the error above, then re-run this script." }

Write-Host ""
Write-Host "=== Step 5/5 : Done ===" -ForegroundColor Cyan
Write-Host ""
Write-Host 'If a "Deployment ready" URL appears above, copy it into your OpenCode chat.'
Write-Host 'No URL? run "vercel deploy --prod --yes" again from this folder.'
Write-Host ""
Read-Host "Press Enter to close this window"