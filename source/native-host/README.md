# BrowserVPN Native Host

Go Native Messaging host for BrowserVPN.

Build on Windows:

```powershell
go build -ldflags="-H=windowsgui" -o dist\browservpn-host.exe .\cmd\browservpn-host
```

Set `BROWSERVPN_SING_BOX` or place `sing-box.exe` at `%LOCALAPPDATA%\BrowserVPN\bin\sing-box.exe`.
The extension never sends executable paths to the host.
