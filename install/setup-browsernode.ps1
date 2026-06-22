$ErrorActionPreference = "Stop"

$ExtensionId = "iolllpbmikocpdikkmjnahimgmdaodjj"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$Project = Join-Path $Root "source"
$ExtensionProject = Join-Path $Project "apps\extension"
$ExtensionOut = Join-Path $Root "BrowserNode-Chrome-Extension"
$InstallDir = Join-Path $env:LOCALAPPDATA "BrowserNode"
$SingBoxDir = Join-Path $Root "sing-box-1.13.13-windows-amd64"
$SingBoxExe = Join-Path $SingBoxDir "sing-box.exe"

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

Require-Path $Project "BrowserNode source project was not found: $Project"
Require-Path $SingBoxExe "sing-box.exe was not found. Expected path: $SingBoxExe"

Say "Stopping old BrowserNode processes"
Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -in @("browernode-host.exe", "sing-box.exe")) -and
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
npm run build
Pop-Location

Say "Creating root extension folder: $ExtensionOut"
Remove-GeneratedDir $ExtensionOut
Copy-Item -LiteralPath (Join-Path $ExtensionProject "dist") -Destination $ExtensionOut -Recurse -Force

Say "Installing sing-box for current user"
$BinDir = Join-Path $InstallDir "bin"
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
Copy-Item -Path (Join-Path $SingBoxDir "*") -Destination $BinDir -Recurse -Force
$InstalledSingBox = Join-Path $BinDir "sing-box.exe"
& $InstalledSingBox version | Select-Object -First 1

Say "Building and installing Native Host"
$HostDir = Join-Path $InstallDir "native-host"
$ScriptsDir = Join-Path $InstallDir "scripts"
New-Item -ItemType Directory -Force -Path $HostDir, $ScriptsDir | Out-Null
Push-Location (Join-Path $Project "native-host")
go test ./...
go build -ldflags="-H=windowsgui" -o (Join-Path $HostDir "browernode-host.exe") .\cmd\browernode-host
Pop-Location
Copy-Item -Path (Join-Path $Project "installer\scripts\*") -Destination $ScriptsDir -Recurse -Force

Say "Registering Chrome Native Messaging Host"
powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptsDir "install-host.ps1") `
  -InstallDir $InstallDir `
  -ExtensionId $ExtensionId `
  -SingBoxPath $InstalledSingBox

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
Write-Host "5. Open BrowserNode, go to settings, import your subscription."
Write-Host ""
Read-Host "Press Enter to exit"
