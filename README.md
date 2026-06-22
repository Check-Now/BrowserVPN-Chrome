# BrowserNode

[中文](README.md) | [English](README.en.md)

BrowserNode 是一个 Windows + Chrome 本地代理工具：Chrome 扩展负责界面和 Chrome 代理控制，Native Host 负责启动 `sing-box.exe`，`sing-box` 在本机 `127.0.0.1` 开启 SOCKS5 端口并连接你选择的节点。

本项目是 source-available / noncommercial 项目，不是 OSI Open Source。仅允许非商业用途。使用者必须遵守所在地法律法规，任何使用后果自行承担。

## 功能

- 导入订阅链接、手动节点、Clash / Mihomo `proxies` 配置。
- 支持 VLESS、VMess、Trojan、Shadowsocks 常见节点。
- 一个订阅链接对应一个节点组。
- 点击节点组可展开或收起该组节点。
- 每个节点组提供单独测速按钮。
- 选择节点后一键连接，断开后自动停止 Native Host 中启动的 `sing-box.exe`。
- 只控制 Chrome 常规窗口代理，不修改 Windows 系统代理。
- 订阅和节点数据保存在本机 Chrome `storage.local`，不读取网页内容。

## 傻瓜式安装

### 1. 准备文件

下载或克隆本仓库后，目录应类似：

```text
BrowserNode/
  install/
  source/
```

本仓库发布版可以直接包含 Windows AMD64 版本的 `sing-box`，目录保持类似：

```text
BrowserNode/
  sing-box-1.13.13-windows-amd64/
    sing-box.exe
```

如果目录名不同，请修改 `install/setup-browsernode.ps1` 里的 `$SingBoxDir`。如果你重新上传或分发 `sing-box`，请同时确认它自己的许可证和 NOTICE 要求。

### 2. 一键安装

双击：

```text
install/一键安装-BrowserNode.bat
```

脚本会自动：

- 检查并安装 Node.js、npm、Go。
- 构建 Chrome 扩展。
- 复制扩展到 `BrowserNode-Chrome-Extension`。
- 安装 `sing-box.exe` 到 `%LOCALAPPDATA%\BrowserNode\bin`。
- 编译并注册 Native Host。
- 打开 Chrome 扩展管理页。

如果双击被拦截，可在 PowerShell 中运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install\setup-browsernode.ps1
```

## 加载 Chrome 扩展

1. 打开 `chrome://extensions`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择：

```text
BrowserNode-Chrome-Extension
```

5. 打开 BrowserNode 扩展设置页。

## 手动生成依赖和构建产物

如果仓库里没有 `node_modules` 或需要重新生成扩展 `dist`，运行：

```powershell
cd source\apps\extension
npm install
npm test
npm run build
```

生成结果：

```text
source/apps/extension/node_modules/
source/apps/extension/dist/
```

如果要重新生成根目录用于 Chrome 加载的扩展目录：

```powershell
cd ..\..\..
Remove-Item .\BrowserNode-Chrome-Extension -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item .\source\apps\extension\dist .\BrowserNode-Chrome-Extension -Recurse
```

## 使用方法

1. 在「订阅管理」中粘贴订阅 URL，点击导入。
2. 每个订阅会作为一个节点组显示在「节点列表」中。
3. 点击节点组标题展开节点列表。
4. 点击该组的「测速」按钮测试当前组节点。
5. 选择一个节点。
6. 点击顶部「连接」。
7. 不需要代理时点击「断开」。

断开后，扩展会清除 Chrome 代理，并让 Native Host 停止 `sing-box.exe`。

## 重启电脑后

不需要手动启动 `sing-box.exe`，也不需要手动启动 Native Host。

重启后直接打开 Chrome，进入 BrowserNode，选择节点并点击「连接」即可。Chrome 会自动唤起 Native Host，Native Host 再启动 `sing-box.exe`。

## 目录结构

```text
BrowserNode/
  README.md                         中文说明
  README.en.md                      English README
  LICENSE                           PolyForm Noncommercial License 1.0.0
  .gitignore
  install/                          面向用户的安装脚本
  source/                           源码
    apps/extension/                 Chrome MV3 扩展
    native-host/                    Go Native Messaging Host
    installer/scripts/              Native Host 注册/卸载脚本
    docs/                           开发文档
  BrowserNode-Chrome-Extension/     从 source/apps/extension/dist 生成的扩展目录，不需要上传
  sing-box-*-windows-amd64/         sing-box Windows AMD64 文件
```

## 卸载

1. 在扩展里点击「断开」。
2. 在 Chrome 扩展管理页移除 BrowserNode。
3. 运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\source\installer\scripts\uninstall-host.ps1
```

4. 可手动删除：

```text
%LOCALAPPDATA%\BrowserNode
```

## 常见问题

### 为什么 sing-box 核心和本地 SOCKS5 显示未启动？

未连接时显示未启动是正常的。点击「连接」并成功启动节点后才会显示运行。

### 这是系统级 VPN 吗？

不是。BrowserNode 只控制 Chrome 常规窗口代理，不修改 Windows 系统代理。

### 为什么 Chrome 扩展加载后 Native Host 无法连接？

通常是扩展 ID 变化导致 Native Host 白名单不匹配。重新运行安装脚本，然后重新加载扩展。

### 为什么测速失败？

节点可能不可达、服务器端口被阻断、订阅节点不完整，或本机网络无法连接该服务器。

## 安全与隐私

- 不读取网页内容。
- 不注入内容脚本。
- 不上传订阅、节点、测速结果到云端。
- 订阅 URL、节点密码、UUID 等都属于敏感信息，不要提交到 GitHub。
- 不要把 GitHub token、订阅链接、代理账号写入 README、issue、commit 或截图。

## 许可证

本项目使用 [PolyForm Noncommercial License 1.0.0](LICENSE)。

你可以在非商业用途下学习、研究、修改和分发本项目。禁止商业用途。软件按“原样”提供，不提供任何担保，使用风险和后果由使用者自行承担。

版权主体：`zhituo wei`。
