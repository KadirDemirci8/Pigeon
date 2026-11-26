# Run from any directory after extracting the ZIP.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $projectRoot 'frontend'
if (-not (Test-Path (Join-Path $frontend 'src\pages\Login.jsx'))) {
    throw "Pigeon frontend not found. Extract this folder into the Pigeon project folder, next to 'frontend'."
}
$backup = Join-Path $PSScriptRoot 'backup'
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item (Join-Path $frontend 'src\pages\Login.jsx') (Join-Path $backup 'Login.jsx') -Force
if (Test-Path (Join-Path $frontend 'src\pages\Login.css')) {
    Copy-Item (Join-Path $frontend 'src\pages\Login.css') (Join-Path $backup 'Login.css') -Force
}
Copy-Item (Join-Path $PSScriptRoot 'payload\src\pages\Login.jsx') (Join-Path $frontend 'src\pages\Login.jsx') -Force
Copy-Item (Join-Path $PSScriptRoot 'payload\src\pages\Login.css') (Join-Path $frontend 'src\pages\Login.css') -Force
Copy-Item (Join-Path $PSScriptRoot 'payload\public\pigeon-login-reference.png') (Join-Path $frontend 'public\pigeon-login-reference.png') -Force
Write-Host 'Pigeon Login design installed. Original Login.jsx and Login.css backed up in package\backup.' -ForegroundColor Green
