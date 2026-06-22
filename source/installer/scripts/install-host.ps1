param(
  [Parameter(Mandatory=$true)][string]$InstallDir,
  [Parameter(Mandatory=$true)][string]$ExtensionId,
  [string]$SingBoxPath = ""
)

$ErrorActionPreference = "Stop"

if ($ExtensionId -notmatch '^[a-p]{32}$') {
  throw "Invalid Chrome extension ID."
}

$hostPath = Join-Path $InstallDir "native-host\browernode-host.exe"
if (!(Test-Path -LiteralPath $hostPath)) {
  throw "Native host executable not found."
}

$manifestTemplate = Join-Path $InstallDir "scripts\native-host-manifest.json.template"
$manifestPath = Join-Path $InstallDir "native-host\com.browernode.host.json"
$escapedHostPath = $hostPath.Replace('\', '\\')
$manifest = Get-Content -Raw -LiteralPath $manifestTemplate
$manifest = $manifest.Replace("__HOST_PATH__", $escapedHostPath)
$manifest = $manifest.Replace("__EXTENSION_ID__", $ExtensionId)
$manifest | Set-Content -Encoding UTF8 -LiteralPath $manifestPath

$key = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.browernode.host"
New-Item -Path $key -Force | Out-Null
Set-Item -Path $key -Value $manifestPath

if ($SingBoxPath) {
  [Environment]::SetEnvironmentVariable("BROWSERNODE_SING_BOX", $SingBoxPath, "User")
}
