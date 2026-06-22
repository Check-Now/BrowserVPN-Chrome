$ErrorActionPreference = "Stop"
$key = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.browernode.host"
if (Test-Path -Path $key) {
  Remove-Item -Path $key -Force
}
