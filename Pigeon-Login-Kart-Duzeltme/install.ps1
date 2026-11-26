$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $projectRoot 'frontend'
$pages = Join-Path $frontend 'src\pages'
if (-not (Test-Path (Join-Path $pages 'Login.jsx'))) { throw 'Pigeon frontend not found.' }
if (-not (Test-Path (Join-Path $frontend 'public\pigeon-login-reference.png'))) { throw 'Original login reference image missing; original Pigeon-Login-Paket must be installed first.' }
$backup = Join-Path $PSScriptRoot 'backup'
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item (Join-Path $pages 'Login.jsx') (Join-Path $backup 'Login.jsx') -Force
Copy-Item (Join-Path $pages 'Login.css') (Join-Path $backup 'Login.css') -Force
Copy-Item (Join-Path $PSScriptRoot 'payload\src\pages\Login.jsx') (Join-Path $pages 'Login.jsx') -Force
Copy-Item (Join-Path $PSScriptRoot 'payload\src\pages\Login.css') (Join-Path $pages 'Login.css') -Force
Write-Host 'Pigeon Login card fixed. Original artwork unchanged; previous files backed up.' -ForegroundColor Green
