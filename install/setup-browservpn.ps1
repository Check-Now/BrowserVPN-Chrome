$ErrorActionPreference = "Stop"

$ExtensionId = "iolllpbmikocpdikkmjnahimgmdaodjj"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$Project = Join-Path $Root "source"
$ExtensionProject = Join-Path $Project "apps\extension"
$ExtensionOut = Join-Path $Root "BrowserVPN-Chrome-Extension"
$InstallDir = Join-Path $env:LOCALAPPDATA "BrowserVPN"
$SingBoxVersion = "1.13.13"
$SingBoxUrl = "https://github.com/SagerNet/sing-box/releases/download/v$SingBoxVersion/sing-box-$SingBoxVersion-windows-amd64.zip"

function Say($Text) {
  Write-Host ""
  Write-Host "==> $Text" -ForegroundColor Cyan
}

function Require-Path($Path, $Message) {
  if (!(Test-Path -LiteralPath $Path)) {
    throw $Message
  }
}

function Add-PathIfExists($Path) {
  if ((Test-Path -LiteralPath $Path) -and (($env:Path -split ';') -notcontains $Path)) {
    $env:Path = "$Path;$env:Path"
  }
}

function Require-LastCommand($Message) {
  if ($LASTEXITCODE -ne 0) {
    throw $Message
  }
}

function Refresh-ToolPath() {
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user;$env:Path"
  Add-PathIfExists "C:\Program Files\Go\bin"
  Add-PathIfExists "$env:LOCALAPPDATA\Programs\Go\bin"
  Add-PathIfExists "C:\Program Files\nodejs"
}

function Ensure-Tool($Name, $WingetId) {
  Refresh-ToolPath
  if (Get-Command $Name -ErrorAction SilentlyContinue) {
    return
  }
  if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "Missing $Name and winget. Install $Name, then run this script again."
  }
  Say "Missing $Name. Installing $WingetId with winget source only."
  winget install --id $WingetId -e --source winget --accept-package-agreements --accept-source-agreements
  Refresh-ToolPath
  if (!(Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is still unavailable. Reopen PowerShell and run this script again."
  }
}

function Remove-GeneratedDir($Path) {
  $rootFull = [IO.Path]::GetFullPath($Root)
  $targetFull = [IO.Path]::GetFullPath($Path)
  if (!$targetFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to delete outside workspace root: $targetFull"
  }
  if (Test-Path -LiteralPath $targetFull) {
    Remove-Item -LiteralPath $targetFull -Recurse -Force
  }
}

Require-Path $Project "BrowserVPN source project was not found: $Project"

Say "Stopping old BrowserVPN processes"
Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -in @("browservpn-host.exe", "sing-box.exe")) -and
    ($_.ExecutablePath -like "$InstallDir*")
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Ensure-Tool "node" "OpenJS.NodeJS.LTS"
Ensure-Tool "npm" "OpenJS.NodeJS.LTS"
Ensure-Tool "go" "GoLang.Go"

Say "Building Chrome extension"
Push-Location $ExtensionProject
npm install
Require-LastCommand "npm install failed"
npm run build
Require-LastCommand "npm run build failed"
Pop-Location

Say "Creating root extension folder: $ExtensionOut"
$ExtensionDist = Join-Path $ExtensionProject "dist"
Require-Path $ExtensionDist "Extension dist was not generated: $ExtensionDist"
Remove-GeneratedDir $ExtensionOut
New-Item -ItemType Directory -Force -Path $ExtensionOut | Out-Null
Copy-Item -Path (Join-Path $ExtensionDist "*") -Destination $ExtensionOut -Recurse -Force
Require-Path (Join-Path $ExtensionOut "manifest.json") "Extension output was not generated correctly: $ExtensionOut"

Say "Installing sing-box for current user"
$BinDir = Join-Path $InstallDir "bin"
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$SingBoxZip = Join-Path ([IO.Path]::GetTempPath()) "browservpn-sing-box-$SingBoxVersion.zip"
$SingBoxExtract = Join-Path ([IO.Path]::GetTempPath()) "browservpn-sing-box-$SingBoxVersion"
Remove-Item -LiteralPath $SingBoxZip -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $SingBoxExtract -Recurse -Force -ErrorAction SilentlyContinue
Invoke-WebRequest -UseBasicParsing -Uri $SingBoxUrl -OutFile $SingBoxZip
Expand-Archive -LiteralPath $SingBoxZip -DestinationPath $SingBoxExtract -Force
$DownloadedSingBox = Get-ChildItem -LiteralPath $SingBoxExtract -Recurse -Filter "sing-box.exe" | Select-Object -First 1
if (!$DownloadedSingBox) {
  throw "Downloaded sing-box archive did not contain sing-box.exe"
}
Copy-Item -Path (Join-Path $DownloadedSingBox.Directory.FullName "*") -Destination $BinDir -Recurse -Force
$InstalledSingBox = Join-Path $BinDir "sing-box.exe"
& $InstalledSingBox version | Select-Object -First 1
Require-LastCommand "sing-box version check failed"
Remove-Item -LiteralPath $SingBoxZip -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $SingBoxExtract -Recurse -Force -ErrorAction SilentlyContinue

Say "Building and installing Native Host"
$HostDir = Join-Path $InstallDir "native-host"
$ScriptsDir = Join-Path $InstallDir "scripts"
New-Item -ItemType Directory -Force -Path $HostDir, $ScriptsDir | Out-Null
Push-Location (Join-Path $Project "native-host")
go test ./...
Require-LastCommand "go test failed"
go build -ldflags="-H=windowsgui" -o (Join-Path $HostDir "browservpn-host.exe") .\cmd\browservpn-host
Require-LastCommand "go build failed"
Pop-Location
Copy-Item -Path (Join-Path $Project "installer\scripts\*") -Destination $ScriptsDir -Recurse -Force

Say "Registering Chrome Native Messaging Host"
powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptsDir "install-host.ps1") `
  -InstallDir $InstallDir `
  -ExtensionId $ExtensionId `
  -SingBoxPath $InstalledSingBox
Require-LastCommand "Native Host registration failed"

Say "Opening extension folder and Chrome extensions page"
Start-Process explorer.exe $ExtensionOut
try {
  Start-Process chrome.exe "chrome://extensions"
} catch {
  Write-Host "Open Chrome manually: chrome://extensions"
}

Write-Host ""
Write-Host "Done. One manual Chrome step remains:" -ForegroundColor Green
Write-Host "1. Enable Developer mode."
Write-Host "2. Click Load unpacked."
Write-Host "3. Choose: $ExtensionOut"
Write-Host "4. Extension ID should be: $ExtensionId"
Write-Host "5. Open BrowserVPN, go to settings, import your subscription."
Write-Host ""
Read-Host "Press Enter to exit"
