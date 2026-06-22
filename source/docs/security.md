# Security

- No system proxy writes.
- No content scripts.
- No telemetry.
- No remote code or `eval`.
- No arbitrary executable path, shell command, URL, or environment variable is accepted from extension messages.
- Local/private subscription URLs and node servers are blocked by default.
- Logs are status-code only and rotate at 1 MB, up to 5 files.

Known ceiling: the current host uses process kill on exit. Add a Windows Job Object before shipping to users who need crash-proof child cleanup.
