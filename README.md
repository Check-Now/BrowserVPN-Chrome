# BrowserNode

[中文](README.md) | [English](README.en.md)

BrowserNode 是一个面向 Windows + Chrome 的本地代理工具。它通过 Chrome 扩展管理订阅、节点和代理规则，通过 Native Host 启动本机 `sing-box`，仅代理 Chrome 常规窗口，不修改 Windows 系统代理。

本项目仅允许非商业用途。使用前请确认符合所在地法律法规，使用风险和后果由使用者自行承担。

![BrowserNode 插件预览](assets/browsernode-preview.png)

## 主要功能

- 导入订阅链接、手动节点、Clash / Mihomo `proxies` 配置。
- 支持常见 VLESS、VMess、Trojan、Shadowsocks 节点。
- 按订阅分组显示节点，支持展开、收起和单组测速。
- 一键连接和断开，断开后自动停止本机代理核心。
- 支持全部代理、按规则代理、指定网站直连。
- 数据保存在本机 Chrome `storage.local`，不读取网页内容。

## 系统要求

- Windows 10 / 11
- Google Chrome 或 Chromium 浏览器
- 安装过程需要网络连接，用于安装依赖和下载 `sing-box`

## 安装

1. 下载或克隆本仓库。
2. 双击运行：

```text
install\一键安装-BrowserNode.bat
```

安装脚本会自动完成：

- 安装或检查 Node.js、npm、Go。
- 构建 Chrome 扩展。
- 生成 `BrowserNode-Chrome-Extension` 目录。
- 下载并安装 `sing-box.exe`。
- 编译并注册 Native Host。
- 打开 Chrome 扩展管理页。

如果双击被系统拦截，可以在 PowerShell 中运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install\setup-browsernode.ps1
```

## 加载扩展

1. 打开 `chrome://extensions`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择仓库根目录下的：

```text
BrowserNode-Chrome-Extension
```

5. 打开 BrowserNode 扩展设置页。

## 使用

1. 在「订阅管理」中导入订阅链接，或添加手动节点。
2. 在「节点列表」中展开订阅组。
3. 点击当前组的「测速」按钮。
4. 选择一个节点。
5. 点击顶部「连接」。
6. 不需要代理时点击「断开」。

重启电脑后不需要手动启动 `sing-box.exe` 或 Native Host。打开 Chrome 后，在 BrowserNode 中点击「连接」即可。

## 卸载

1. 在扩展中点击「断开」。
2. 在 Chrome 扩展管理页移除 BrowserNode。
3. 运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\source\installer\scripts\uninstall-host.ps1
```

4. 可手动删除本机安装目录：

```text
%LOCALAPPDATA%\BrowserNode
```

## 隐私

- 不读取网页内容。
- 不注入网页脚本。
- 不上传订阅、节点或测速结果。
- 仅控制 Chrome 常规窗口代理。

## 许可

本项目使用 [PolyForm Noncommercial License 1.0.0](LICENSE)。

允许非商业用途下的学习、研究、修改和分发。禁止商业用途。软件按“原样”提供，不提供任何担保。

Copyright (C) 2026 zhituo wei
