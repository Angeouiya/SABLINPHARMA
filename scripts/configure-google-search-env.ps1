param(
  [string]$ProjectRef = "pztpdigzgukntmvfsqmt",
  [string]$VercelEnvironment = "production",
  [switch]$Deploy
)

$ErrorActionPreference = "Stop"

function Read-RequiredSecret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
  if ([string]::IsNullOrWhiteSpace($plain)) {
    throw "Valeur obligatoire manquante: $Prompt"
  }
  return $plain.Trim()
}

function Set-VercelSecret([string]$Name, [string]$Value) {
  $envList = npx --yes vercel@latest env ls | Out-String
  if ($envList -match "(?m)^\s*$([Regex]::Escape($Name))\s+") {
    $Value | npx --yes vercel@latest env update $Name $VercelEnvironment --yes --sensitive
  } else {
    $Value | npx --yes vercel@latest env add $Name $VercelEnvironment --sensitive
  }
}

Write-Host "Configuration Google/Web SABLIN PHARMA" -ForegroundColor Green
Write-Host "Les valeurs ne seront pas écrites dans Git." -ForegroundColor Yellow

$googleApiKey = Read-RequiredSecret "Coller GOOGLE_SEARCH_API_KEY"
$googleSearchEngineId = Read-RequiredSecret "Coller GOOGLE_SEARCH_ENGINE_ID"

Set-VercelSecret "GOOGLE_SEARCH_API_KEY" $googleApiKey
Set-VercelSecret "GOOGLE_SEARCH_ENGINE_ID" $googleSearchEngineId
Set-VercelSecret "ENABLE_EXTERNAL_ENRICHMENT" "true"
Set-VercelSecret "ENRICHMENT_DAILY_LIMIT" "100"
Set-VercelSecret "ENRICHMENT_CONFIDENCE_THRESHOLD" "85"

$tempEnv = Join-Path $env:TEMP ("sablin-google-search-" + [Guid]::NewGuid().ToString("N") + ".env")
try {
  @(
    "GOOGLE_SEARCH_API_KEY=$googleApiKey"
    "GOOGLE_SEARCH_ENGINE_ID=$googleSearchEngineId"
    "ENABLE_EXTERNAL_ENRICHMENT=true"
    "ENRICHMENT_DAILY_LIMIT=100"
    "ENRICHMENT_CONFIDENCE_THRESHOLD=85"
  ) | Set-Content -LiteralPath $tempEnv -Encoding UTF8
  npx --yes supabase@latest secrets set --env-file $tempEnv --project-ref $ProjectRef
} finally {
  if (Test-Path -LiteralPath $tempEnv) {
    Remove-Item -LiteralPath $tempEnv -Force
  }
}

if ($Deploy) {
  npx --yes vercel@latest deploy --prod --yes
}

Write-Host "Google/Web est configure. Testez ensuite /admin/enrichissement-medicaments > Tester la configuration." -ForegroundColor Green

