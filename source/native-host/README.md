# BrowserNode Native Host

Go Native Messaging host for BrowserNode.

Build on Windows:

```powershell
go build -ldflags="-H=windowsgui" -o dist\browernode-host.exe .\cmd\browernode-host
```

Set `BROWSERNODE_SING_BOX` or place `sing-box.exe` at `%LOCALAPPDATA%\BrowserNode\bin\sing-box.exe`.
The extension never sends executable paths to the host.
