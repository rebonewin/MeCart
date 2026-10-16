# auto-deploy.ps1 — fully automated authenticated Vercel production deploy.
# Secret stays inside this local runner; it is NEVER echoed.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$cli = "C:\Users\HP\AppData\Local\npm-cache\_npx\67eb4586ca667318\node_modules\vercel\dist\index.js"
if (-not (Test-Path $cli)) { throw "Vercel CLI not found" }

$token = (Get-Content "C:\Users\HP\AppData\Local\Temp\opencode\vercel-token.txt").Trim()
if (-not $token) { throw "Token file is empty" }
$env:VERCEL_TOKEN = $token

Write-Host "[1/6] whoami" -ForegroundColor Cyan
& $cli whoami
if ($LASTEXITCODE -ne 0) { throw "Token did not authenticate" }

Write-Host "[2/6] link project" -ForegroundColor Cyan
& $cli link --project me-cart --scope born6 --yes
if ($LASTEXITCODE -ne 0) { throw "link failed; inspect Project/Team slugs" }

Write-Host "[3/6] existing env keys" -ForegroundColor Cyan
$existing = (& $cli env ls production 2>&1) | Out-String
Write-Host $existing

Write-Host "[4/6] sync missing env keys (values piped, never printed)" -ForegroundColor Cyan
$required = @("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SITE_URL","ADMIN_EMAIL")
foreach ($key in $required) {
    if ($existing -match [regex]::Escape($key)) {
        Write-Host "  ok  $key (already set)"
    } else {
        Write-Host "  adding $key"
        $line = Get-Content ".env.local" | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
        if (-not $line) { throw "$key missing in .env.local" }
        $val = $line.Substring($key.Length + 1)
        $val | & $cli env add $key production
        if ($LASTEXITCODE -ne 0) { throw "env add $key failed" }
        Write-Host "  ok  $key added"
    }
}

Write-Host "[5/6] production deploy (cloud build)" -ForegroundColor Cyan
& $cli deploy --prod --yes
if ($LASTEXITCODE -ne 0) { throw "deploy failed" }
Write-Host "  deploy finished"

Write-Host "[6/6] verify remote HEAD + dump result to deploy-result.txt" -ForegroundColor Cyan
$logs = @(
  "remote=$(git rev-parse HEAD)",
  "date=$(Get-Date -Format u)"
)
$logs | Set-Content -Encoding ascii deploy-result.txt
Write-Host "recorded deploy-result.txt"
Write-Host "ALL STEPS COMPLETE"