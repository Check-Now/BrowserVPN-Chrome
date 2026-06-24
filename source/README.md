# BrowserVPN-Chrome

BrowserVPN-Chrome is a Windows + Chrome local proxy tool. It uses a Manifest V3 extension to control only Chrome's regular-window proxy settings, and a Go Native Messaging host to run `sing-box.exe` on `127.0.0.1`.

It does not set the Windows system proxy, inject content scripts, read page content, or send subscription/node data to a cloud service.

## Architecture

```text
Chrome MV3 extension
  -> Native Messaging host: com.browservpn.chrome.host
  -> sing-box.exe with SOCKS5 inbound on 127.0.0.1:random
  -> selected VLESS / VMess / Trojan / Shadowsocks outbound
```

## Project Tree

```text
BrowserVPN-Chrome/
  apps/extension/        MV3 extension, parser, UI, proxy control
  native-host/           Go Native Messaging host
  installer/             Inno Setup and PowerShell install scripts
  docs/                  Architecture, security, install, troubleshooting
  tests/                 Parser tests
```

## Protocol Support

| Protocol | Supported in this version |
| --- | --- |
| VLESS | TCP, TLS, Reality, WebSocket, gRPC |
| VMess | Base64 JSON, TCP, TLS, WebSocket, gRPC |
| Trojan | TCP, TLS, WebSocket, gRPC |
| Shadowsocks | Common AEAD and 2022 methods, no plugins |
| Clash / Mihomo YAML | `proxies` array only |

Unsupported nodes are shown with a reason. Unknown transport/security fields fail closed.

## Not Supported

- Clash scripts, `rule-providers`, `proxy-providers`, remote control APIs, and external speed-test APIs.
- Shadowsocks plugins and external helper binaries.
- System-wide VPN behavior.
- Automatic bypass of enterprise policies or organization network controls.

## Dependencies

- Node.js 20+ and npm for the extension.
- Go 1.22+ for the native host.
- Inno Setup 6 if you want the Windows installer.
- A local `sing-box.exe`. The release repository may include a Windows AMD64 sing-box build at the repository root.

If you redistribute sing-box, handle its license, NOTICE, and source obligations yourself.

## Build

```powershell
cd BrowserVPN-Chrome\apps\extension
npm install
npm test
npm run build

cd ..\..\native-host
go test ./...
go build -ldflags="-H=windowsgui" -o dist\browservpn-chrome-host.exe .\cmd\browservpn-chrome-host
```

## Load The Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select `BrowserVPN-Chrome\apps\extension\dist`.
5. Copy the generated extension ID.

## Native Host Setup

The host manifest must allow only your BrowserVPN-Chrome extension ID:

```json
{
  "name": "com.browservpn.chrome.host",
  "path": "C:\\Users\\you\\AppData\\Local\\BrowserVPN-Chrome\\native-host\\browservpn-chrome-host.exe",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://<extension-id>/"]
}
```

Install for the current user:

```powershell
powershell -ExecutionPolicy Bypass -File BrowserVPN-Chrome\installer\scripts\install-host.ps1 `
  -InstallDir "$env:LOCALAPPDATA\BrowserVPN-Chrome" `
  -ExtensionId "<extension-id>" `
  -SingBoxPath "C:\Tools\sing-box\sing-box.exe"
```

The script writes only:

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.browservpn.chrome.host
```

Uninstall:

```powershell
powershell -ExecutionPolicy Bypass -File BrowserVPN-Chrome\installer\scripts\uninstall-host.ps1
```

## Confirm Only Chrome Is Proxied

Connect a node in the extension, then check:

- Chrome proxy points to `127.0.0.1:<random-port>`.
- Edge, desktop apps, games, and Windows system network settings are unchanged.
- Disconnecting calls `chrome.proxy.settings.clear()` instead of forcing global `direct`.

## Security Boundary

Subscription URLs and node configs are sensitive and untrusted input. BrowserVPN-Chrome validates protocols, blocks localhost/private node addresses by default, redacts logs, and does not store full node URIs in normal UI.

Chrome proxying is not a full-system VPN. WebRTC, Chrome Secure DNS, enterprise policies, and other extensions may affect actual traffic behavior.

## Logs

Native host logs are stored under:

```text
%LOCALAPPDATA%\BrowserVPN-Chrome\logs\
```

Logs contain status/error codes only. They intentionally avoid subscription URLs, UUIDs, passwords, full domains, and visited websites.

## Manual Acceptance Checklist

```text
[ ] Chrome can load the extension
[ ] Native Host can be recognized by Chrome
[ ] Subscriptions can be imported
[ ] Supported and unsupported nodes are displayed
[ ] Selecting a node can start sing-box
[ ] Chrome proxy points to localhost random SOCKS5 port
[ ] Chrome can access a test site
[ ] Edge, WeChat, and Windows system networking are unaffected
[ ] Disconnect restores Chrome proxy control
[ ] State is consistent after restarting Chrome
[ ] Native Host uninstall removes the registry key
[ ] Windows Settings can uninstall BrowserVPN-Chrome Native Host
```

## Known Limits

- The extension UI is vanilla TypeScript instead of React; this keeps the shipped surface smaller.
- The Clash YAML reader handles the `proxies` array shapes covered by tests, not full YAML.
- The Go host kills the child process on normal host exit; a production build should add a Windows Job Object guard.
- Integration tests that run `sing-box.exe` are manual unless `sing-box.exe` is installed locally.
