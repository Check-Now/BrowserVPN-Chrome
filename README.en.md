# BrowserNode

[中文](README.md) | [English](README.en.md)

BrowserNode is a local proxy tool for Windows and Chrome. It uses a Chrome extension to manage subscriptions, nodes, and proxy rules, and a Native Host to start local `sing-box`. It only proxies regular Chrome windows and does not change the Windows system proxy.

This project is for noncommercial use only. Users are responsible for complying with local laws and for all consequences of use.

![BrowserNode extension preview](assets/browsernode-preview.png)

## Features

- Import subscription URLs, manual nodes, and Clash / Mihomo `proxies` configs.
- Supports common VLESS, VMess, Trojan, and Shadowsocks nodes.
- Groups nodes by subscription, with expand/collapse and per-group latency testing.
- One-click connect and disconnect. Disconnecting stops the local proxy core.
- Supports proxy-all, rule-based proxy, and direct-site bypass modes.
- Data stays in local Chrome `storage.local`. Page content is not read.

## Requirements

- Windows 10 / 11
- Google Chrome or Chromium
- Internet access during installation to install dependencies and download `sing-box`

## Install

1. Download or clone this repository.
2. Double-click:

```text
install\一键安装-BrowserNode.bat
```

The installer will:

- Install or check Node.js, npm, and Go.
- Build the Chrome extension.
- Generate the `BrowserNode-Chrome-Extension` folder.
- Download and install `sing-box.exe`.
- Build and register the Native Host.
- Open the Chrome extensions page.

If double-clicking is blocked, run this in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install\setup-browsernode.ps1
```

## Load Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select this folder under the repository root:

```text
BrowserNode-Chrome-Extension
```

5. Open the BrowserNode extension settings page.

## Usage

1. Import a subscription URL or add manual nodes in Subscription Management.
2. Expand a subscription group in the Node List.
3. Click the group's latency-test button.
4. Select a node.
5. Click "Connect".
6. Click "Disconnect" when the proxy is no longer needed.

After rebooting Windows, you do not need to start `sing-box.exe` or the Native Host manually. Open Chrome and click "Connect" in BrowserNode.

## Uninstall

1. Click "Disconnect" in the extension.
2. Remove BrowserNode from Chrome extensions.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\source\installer\scripts\uninstall-host.ps1
```

4. Optionally delete the local install directory:

```text
%LOCALAPPDATA%\BrowserNode
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
