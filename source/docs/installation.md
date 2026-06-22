# Installation

1. Build the extension with `npm run build`.
2. Load `apps/extension/dist` in Chrome Developer mode.
3. Copy the extension ID.
4. Build `native-host/dist/browernode-host.exe`.
5. Install the host with `installer/scripts/install-host.ps1`.
6. Put `sing-box.exe` under `%LOCALAPPDATA%\BrowserNode\bin\sing-box.exe` or set `BROWSERNODE_SING_BOX`.

The host is registered for the current user only under:

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.browernode.host
```
