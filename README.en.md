# BrowserNode

[中文](README.md) | [English](README.en.md)

BrowserNode is a local proxy tool for Windows and Chrome. The Chrome extension provides the UI and controls Chrome proxy settings. The Native Host starts `sing-box.exe`, and `sing-box` opens a local SOCKS5 listener on `127.0.0.1` for the selected node.

This project is source-available / noncommercial. It is not OSI Open Source. Commercial use is not allowed. Users must follow their local laws and regulations and use this software at their own risk.

## Features

- Import subscription URLs, manual nodes, and Clash / Mihomo `proxies` configs.
- Supports common VLESS, VMess, Trojan, and Shadowsocks nodes.
- Each subscription URL is shown as one node group.
- Click a node group to expand or collapse its nodes.
- Each node group has its own latency-test button.
- Select a node and connect with one click.
- Disconnecting clears Chrome proxy settings and stops the `sing-box.exe` process started by the Native Host.
- Only controls regular Chrome window proxy settings. It does not change the Windows system proxy.
- Subscription and node data stay in local Chrome `storage.local`. Page content is not read.

## Simple Install

### 1. Prepare files

After downloading or cloning this repository, the folder should look like this:

```text
BrowserNode/
  install/
  source/
```

The release repository may include the Windows AMD64 build of `sing-box` in the repository root:

```text
BrowserNode/
  sing-box-1.13.13-windows-amd64/
    sing-box.exe
```

If the folder name is different, edit `$SingBoxDir` in `install/setup-browsernode.ps1`. If you redistribute `sing-box`, confirm its own license and NOTICE requirements.

### 2. Run installer

Double-click:

```text
install/一键安装-BrowserNode.bat
```

The script will:

- Check and install Node.js, npm, and Go.
- Build the Chrome extension.
- Copy the extension to `BrowserNode-Chrome-Extension`.
- Install `sing-box.exe` to `%LOCALAPPDATA%\BrowserNode\bin`.
- Build and register the Native Host.
- Open the Chrome extensions page.

If double-clicking is blocked, run this in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install\setup-browsernode.ps1
```

## Load The Chrome Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select:

```text
BrowserNode-Chrome-Extension
```

5. Open the BrowserNode extension settings page.

## Regenerate Dependencies And Build Output

If `node_modules` is missing or you need to regenerate the extension `dist`, run:

```powershell
cd source\apps\extension
npm install
npm test
npm run build
```

Generated output:

```text
source/apps/extension/node_modules/
source/apps/extension/dist/
```

To regenerate the root extension folder loaded by Chrome:

```powershell
cd ..\..\..
Remove-Item .\BrowserNode-Chrome-Extension -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item .\source\apps\extension\dist .\BrowserNode-Chrome-Extension -Recurse
```

## Usage

1. Paste a subscription URL in Subscription Management and import it.
2. Each subscription appears as a node group in the Node List.
3. Click the group title to expand the nodes.
4. Click the group's latency-test button to test that group.
5. Select a node.
6. Click "Connect".
7. Click "Disconnect" when you no longer need the proxy.

After disconnecting, the extension clears Chrome proxy settings and asks the Native Host to stop `sing-box.exe`.

## After Reboot

You do not need to start `sing-box.exe` or the Native Host manually.

After rebooting, open Chrome, open BrowserNode, select a node, and click "Connect". Chrome will start the Native Host automatically, and the Native Host will start `sing-box.exe`.

## Project Structure

```text
BrowserNode/
  README.md                         Chinese README
  README.en.md                      English README
  LICENSE                           PolyForm Noncommercial License 1.0.0
  .gitignore
  install/                          User-facing installer scripts
  source/                           Source code
    apps/extension/                 Chrome MV3 extension
    native-host/                    Go Native Messaging Host
    installer/scripts/              Native Host install/uninstall scripts
    docs/                           Developer docs
  BrowserNode-Chrome-Extension/     Generated from source/apps/extension/dist, no need to upload
  sing-box-*-windows-amd64/         sing-box Windows AMD64 files
```

## Uninstall

1. Click "Disconnect" in the extension.
2. Remove BrowserNode from Chrome extensions.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\source\installer\scripts\uninstall-host.ps1
```

4. Optionally delete:

```text
%LOCALAPPDATA%\BrowserNode
```

## FAQ

### Why do sing-box core and local SOCKS5 show as stopped?

That is normal when BrowserNode is disconnected. They show as running only after a node is connected successfully.

### Is this a system-wide VPN?

No. BrowserNode only controls regular Chrome window proxy settings. It does not change the Windows system proxy.

### Why cannot the extension connect to the Native Host?

The extension ID may have changed and no longer matches the Native Host allowlist. Re-run the installer, then reload the extension.

### Why does latency testing fail?

The node may be unreachable, blocked, incomplete, or unavailable from your local network.

## Security And Privacy

- Does not read page content.
- Does not inject content scripts.
- Does not upload subscriptions, nodes, or latency results to a cloud service.
- Subscription URLs, node passwords, UUIDs, and tokens are sensitive. Do not commit them to GitHub.
- Do not put GitHub tokens, subscription links, proxy accounts, or screenshots containing secrets in README files, issues, commits, or screenshots.

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

You may study, research, modify, and distribute this project for noncommercial purposes. Commercial use is not allowed. The software is provided as is, without warranty, and users are responsible for their own use and consequences.

Copyright holder: `zhituo wei`.
