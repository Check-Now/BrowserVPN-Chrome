# Protocol Support

| Protocol | Current support |
| --- | --- |
| VLESS | TCP, TLS, Reality, WebSocket, gRPC |
| VMess | Base64 JSON, TCP, TLS, WebSocket, gRPC |
| Trojan | TCP, TLS, WebSocket, gRPC |
| Shadowsocks | Common AEAD and 2022 ciphers |
| Clash / Mihomo | `proxies` array only |

Unsupported:

- Shadowsocks plugin execution.
- Clash scripts, providers, and remote APIs.
- Unknown transport/security values.

Unknown values fail closed so TLS, Reality, SNI, transport, and cipher settings are not silently downgraded.
