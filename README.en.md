# BrowserVPN-Chrome

[中文](README.md) | [English](README.en.md)

BrowserVPN-Chrome is a local proxy/VPN tool for Windows and Chrome. It combines a Chrome extension, a Native Host, and `sing-box` to import subscriptions, test nodes, select nodes, connect, and disconnect. It controls regular Chrome window proxy settings only and does not change the Windows system proxy.

This project is source-available for noncommercial use only. Users are responsible for complying with local laws and for all consequences of use.

![BrowserVPN-Chrome extension preview](assets/browservpn-preview.png)

## Features

- Chrome proxy/VPN extension powered by local `sing-box`.
- Import subscription URLs, manual nodes, and Clash / Mihomo `proxies` configs.
- Supports common VLESS, VMess, Trojan, and Shadowsocks nodes.
- Groups nodes by subscription source with per-group latency testing.
- Supports proxy-all, rule-based proxy, and default proxy with direct rules.
- Disconnecting automatically stops the local proxy core.
- Subscription and node data stay in local Chrome `storage.local`; page content is not read.

## Support

| Item | Support |
| --- | --- |
| OS | Windows 10 / 11 |
| Browser | Google Chrome / Chromium |
| Core | sing-box |
| Local proxy | SOCKS5 |
| Protocols | VLESS, VMess, Trojan, Shadowsocks |
| Config formats | Subscription URL, Clash / Mihomo YAML |

## Install

Download or clone this repository, then double-click:

```text
install\一键安装-BrowserVPN-Chrome.bat
```

The installer will:

- Check or install Node.js, npm, and Go.
- Build the Chrome extension.
- Generate the `BrowserVPN-Chrome-Extension` folder.
- Download and install `sing-box.exe`.
- Build and register the Native Host.
- Open the Chrome extensions page.

If double-clicking is blocked, run this in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install\setup-browservpn-chrome.ps1
```

## Load Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select `BrowserVPN-Chrome-Extension` under the repository root.
5. Open the BrowserVPN-Chrome extension settings page.

## Usage

1. Import a subscription URL or add manual nodes in Subscription Management.
2. Expand a subscription group in the Node List.
3. Click the group's latency-test button.
4. Select a node.
5. Click "Connect".
6. Click "Disconnect" when the proxy is no longer needed.

After rebooting Windows, you do not need to start `sing-box.exe` or the Native Host manually. Open Chrome and click "Connect" in BrowserVPN-Chrome.

## Build from Source

```powershell
cd source\apps\extension
npm install
npm run build
npm test
```

The extension build output is:

```text
source\apps\extension\dist
```

The one-click installer copies it to:

```text
BrowserVPN-Chrome-Extension
```

## Uninstall

1. Click "Disconnect" in the extension.
2. Remove BrowserVPN-Chrome from Chrome extensions.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\source\installer\scripts\uninstall-host.ps1
```

4. Optionally delete the local install directory:

```text
%LOCALAPPDATA%\BrowserVPN-Chrome
```

## Privacy

- Does not read page content.
- Does not inject page scripts.
- Does not upload subscriptions, nodes, or latency results.
- Only controls regular Chrome window proxy settings.

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

You may study, research, modify, and distribute this project for noncommercial purposes. Commercial use is not allowed. The software is provided as is, without warranty.

Copyright (C) 2026 zhituo wei
