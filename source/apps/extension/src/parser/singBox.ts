import type { CanonicalNode, Transport } from "../shared/types";

export function buildSingBoxConfig(node: CanonicalNode, socksPort: number): Record<string, unknown> {
  return {
    log: { level: "warn" },
    inbounds: [
      {
        type: "socks",
        tag: "socks-in",
        listen: "127.0.0.1",
        listen_port: socksPort
      }
    ],
    outbounds: [buildOutbound(node)],
    route: { final: "proxy" }
  };
}

export function buildOutbound(node: CanonicalNode): Record<string, unknown> {
  const common: Record<string, unknown> = {
    type: node.protocol === "shadowsocks" ? "shadowsocks" : node.protocol,
    tag: "proxy",
    server: node.server,
    server_port: node.serverPort
  };
  if (node.protocol === "vless" || node.protocol === "vmess") common.uuid = node.uuid;
  if (node.protocol === "trojan" || node.protocol === "shadowsocks") common.password = node.password;
  if (node.protocol === "shadowsocks") common.method = node.method;
  if (node.protocol === "vmess") {
    common.security = node.cipher ?? "auto";
    common.alter_id = node.alterId ?? 0;
  }
  const tls = buildTls(node);
  if (tls) common.tls = tls;
  const transport = buildTransport(node.transport);
  if (transport) common.transport = transport;
  return common;
}

function buildTls(node: CanonicalNode): Record<string, unknown> | undefined {
  if (node.security === "none") return undefined;
  const tls: Record<string, unknown> = {
    enabled: true
  };
  if (node.sni) tls.server_name = node.sni;
  if (node.alpn?.length) tls.alpn = node.alpn;
  if (node.security === "reality") {
    tls.reality = {
      enabled: true,
      public_key: "realityPublicKey" in node ? node.realityPublicKey : undefined,
      short_id: "realityShortId" in node ? node.realityShortId : undefined
    };
    if ("realityFingerprint" in node && node.realityFingerprint) {
      tls.utls = { enabled: true, fingerprint: node.realityFingerprint };
    }
  }
  return tls;
}

function buildTransport(transport: Transport): Record<string, unknown> | undefined {
  if (transport.type === "tcp") return undefined;
  if (transport.type === "ws") {
    return {
      type: "ws",
      path: transport.path || "/",
      headers: transport.host ? { Host: transport.host } : undefined
    };
  }
  return {
    type: "grpc",
    service_name: transport.serviceName || ""
  };
}
