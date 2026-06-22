# Troubleshooting

## Chrome cannot find the Native Host

- Check the extension ID in the host manifest.
- Check the registry default value points to the manifest JSON.
- Check the manifest `path` points to `browservpn-host.exe`.

## Connect fails before Chrome proxy changes

The host validates the node and runs `sing-box check -c` before Chrome proxy is set. Fix the node config or `sing-box.exe` path.

## Chrome cannot access websites after an error

Open the popup and click disconnect. The extension calls `chrome.proxy.settings.clear()` for the regular profile.

## Logs

Check:

```text
%LOCALAPPDATA%\BrowserVPN\logs\
```

Logs are redacted status codes, not full subscription or node data.
