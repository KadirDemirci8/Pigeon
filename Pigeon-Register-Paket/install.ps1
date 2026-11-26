$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $packageRoot
$src = Join-Path $projectRoot "frontend\src\pages"
$public = Join-Path $projectRoot "frontend\public"
$backup = Join-Path $packageRoot "backup"

if (!(Test-Path (Join-Path $src "Register.jsx"))) {
    throw "Pigeon project not found. Run from the root folder C:\Users\Kadir\Desktop\Pigeon"
}
New-Item -Path $backup -ItemType Directory -Force | Out-Null
foreach ($file in @("Register.jsx", "Register.css")) {
    $current = Join-Path $src $file
    if (Test-Path $current) {
        Copy-Item $current (Join-Path $backup $file) -Force
    }
}
Copy-Item (Join-Path $packageRoot "files\Register.jsx") (Join-Path $src "Register.jsx") -Force
Copy-Item (Join-Path $packageRoot "files\Register.css") (Join-Path $src "Register.css") -Force
Copy-Item (Join-Path $packageRoot "files\pigeon-register-reference.png") (Join-Path $public "pigeon-register-reference.png") -Force
Write-Host "Pigeon Register V1 installed. Existing Register files backed up in Pigeon-Register-Paket\backup." -ForegroundColor Green
