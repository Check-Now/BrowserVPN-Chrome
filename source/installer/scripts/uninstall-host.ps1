$ErrorActionPreference = "Stop"
$key = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.browservpn.host"
if (Test-Path -Path $key) {
  Remove-Item -Path $key -Force
}
