# BrowserVPN-Chrome Native Host

Go Native Messaging host for BrowserVPN-Chrome.

Build on Windows:

```powershell
go build -ldflags="-H=windowsgui" -o dist\browservpn-chrome-host.exe .\cmd\browservpn-chrome-host
```

Set `BROWSERVPN_CHROME_SING_BOX` or place `sing-box.exe` at `%LOCALAPPDATA%\BrowserVPN-Chrome\bin\sing-box.exe`.
The extension never sends executable paths to the host.
