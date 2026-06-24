$ErrorActionPreference = "Stop"
foreach ($key in @(
  "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.browservpn.chrome.host",
  "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.browservpn.host"
)) {
  Remove-Item -Path $key -Force -ErrorAction SilentlyContinue
}
