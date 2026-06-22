# Architecture

BrowserNode has three moving pieces:

1. Chrome MV3 extension parses subscriptions, stores local state, and controls only `chrome.proxy.settings` for the regular profile.
2. Go Native Messaging host receives strict JSON messages over Chrome's length-prefixed stdio protocol.
3. `sing-box.exe` runs with a SOCKS5 inbound bound to `127.0.0.1:<random-port>`.

The extension starts the host once through `chrome.runtime.connectNative`. `start` validates the selected node, writes a temporary sing-box config under `%LOCALAPPDATA%\BrowserNode\runtime\`, runs `sing-box check -c`, starts `sing-box run -c`, waits for the local SOCKS5 port, then lets the extension set Chrome's proxy.

Disconnect clears Chrome proxy control first, then stops sing-box and deletes the temporary config.
