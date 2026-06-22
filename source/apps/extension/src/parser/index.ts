import type {
  CanonicalNode,
  ParseResult,
  Protocol,
  SecurityType,
  ShadowsocksNode,
  Transport,
  TrojanNode,
  VlessNode,
  VmessNode
} from "../shared/types";
import { assertPublicServer, isValidPort, isValidUuid } from "./validation";

export interface ParseOptions {
  allowPrivateServers?: boolean;
  sourceSubscriptionId?: string;
  sourceSubscriptionName?: string;
}

const ssMethods = new Set([
  "aes-128-gcm",
  "aes-192-gcm",
  "aes-256-gcm",
  "chacha20-ietf-poly1305",
  "xchacha20-ietf-poly1305",
  "2022-blake3-aes-128-gcm",
  "2022-blake3-aes-256-gcm",
  "2022-blake3-chacha20-poly1305"
]);

export function parseSubscription(input: string, options: ParseOptions = {}): ParseResult {
  const text = input.trim();
  if (!text) return { nodes: [], unsupported: [] };

  const candidate = decodeBase64Loose(text);
  const body = candidate && looksLikeSubscription(candidate) ? candidate : text;

  if (looksLikeClashYaml(body)) return parseClashYaml(body, options);
  return parseUriLines(body, options);
}

export function parseUriLines(input: string, options: ParseOptions = {}): ParseResult {
  const result: ParseResult = { nodes: [], unsupported: [] };
  for (const line of input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) {
    try {
      result.nodes.push(parseNodeUri(line, options));
    } catch (error) {
      result.unsupported.push({ input: redact(line), reason: errorMessage(error) });
    }
  }
  return result;
}

export function parseNodeUri(uri: string, options: ParseOptions = {}): CanonicalNode {
  if (uri.startsWith("vless://")) return parseVless(uri, options);
  if (uri.startsWith("vmess://")) return parseVmess(uri, options);
  if (uri.startsWith("trojan://")) return parseTrojan(uri, options);
  if (uri.startsWith("ss://")) return parseShadowsocks(uri, options);
  throw new Error("unsupported protocol");
}

function parseVless(uri: string, options: ParseOptions): VlessNode {
  const url = safeUrl(uri);
  const uuid = decodeURIComponent(url.username);
  if (!isValidUuid(uuid)) throw new Error("invalid VLESS UUID");
  const serverPort = readPort(url);
  const security = readSecurity(url.searchParams.get("security"));
  assertPublicServer(url.hostname, options.allowPrivateServers);
  const transport = readTransport(url.searchParams);
  const node: VlessNode = {
    ...baseNode("vless", url, serverPort, security, transport, options),
    protocol: "vless",
    uuid,
    flow: value(url.searchParams.get("flow")),
    realityPublicKey: value(url.searchParams.get("pbk") ?? url.searchParams.get("public-key")),
    realityShortId: value(url.searchParams.get("sid") ?? url.searchParams.get("short-id")),
    realityFingerprint: value(url.searchParams.get("fp") ?? url.searchParams.get("fingerprint"))
  };
  if (security === "reality" && !node.realityPublicKey) {
    throw new Error("Reality public key is required");
  }
  return node;
}

function parseVmess(uri: string, options: ParseOptions): VmessNode {
  const raw = decodeBase64Loose(uri.slice("vmess://".length));
  if (!raw) throw new Error("invalid VMess base64");
  const data = JSON.parse(raw) as Record<string, unknown>;
  const uuid = String(data.id ?? "");
  if (!isValidUuid(uuid)) throw new Error("invalid VMess UUID");
  const server = String(data.add ?? "");
  const serverPort = Number(data.port);
  if (!isValidPort(serverPort)) throw new Error("invalid VMess port");
  assertPublicServer(server, options.allowPrivateServers);
  const transport = fromSimpleTransport(String(data.net ?? "tcp"), {
    host: String(data.host ?? ""),
    path: String(data.path ?? ""),
    serviceName: String(data.path ?? "")
  });
  const security = data.tls === "tls" ? "tls" : "none";
  return {
    id: stableId("vmess", server, serverPort, uuid),
    protocol: "vmess",
    name: String(data.ps || server),
    server,
    serverPort,
    security,
    sni: String(data.sni || data.host || "") || undefined,
    alpn: splitCsv(String(data.alpn ?? "")),
    transport,
    uuid,
    alterId: Number(data.aid ?? 0),
    cipher: String(data.scy ?? "auto"),
    sourceSubscriptionId: options.sourceSubscriptionId,
    sourceSubscriptionName: options.sourceSubscriptionName
  };
}

function parseTrojan(uri: string, options: ParseOptions): TrojanNode {
  const url = safeUrl(uri);
  const password = decodeURIComponent(url.username);
  if (!password) throw new Error("trojan password is required");
  const serverPort = readPort(url);
  assertPublicServer(url.hostname, options.allowPrivateServers);
  const security = readSecurity(url.searchParams.get("security") ?? "tls");
  return {
    ...baseNode("trojan", url, serverPort, security, readTransport(url.searchParams), options),
    protocol: "trojan",
    password
  };
}

function parseShadowsocks(uri: string, options: ParseOptions): ShadowsocksNode {
  const fragmentIndex = uri.indexOf("#");
  const name = fragmentIndex >= 0 ? decodeURIComponent(uri.slice(fragmentIndex + 1)) : "";
  const noFragment = fragmentIndex >= 0 ? uri.slice(0, fragmentIndex) : uri;
  if (new URL(noFragment).searchParams.has("plugin")) throw new Error("Shadowsocks plugin is not supported");
  const payload = noFragment.slice("ss://".length).split("?")[0];
  const decodedPayload = payload.includes("@") ? payload : (decodeBase64Loose(payload) ?? "");
  const at = decodedPayload.lastIndexOf("@");
  const colon = decodedPayload.indexOf(":");
  if (at < 0 || colon < 0 || colon > at) throw new Error("invalid Shadowsocks URI");
  const method = decodedPayload.slice(0, colon);
  const password = decodedPayload.slice(colon + 1, at);
  const hostPort = decodedPayload.slice(at + 1);
  const [server, portText] = splitHostPort(hostPort);
  const serverPort = Number(portText);
  if (!ssMethods.has(method)) throw new Error("unsupported Shadowsocks method");
  if (!password) throw new Error("Shadowsocks password is required");
  if (!isValidPort(serverPort)) throw new Error("invalid Shadowsocks port");
  assertPublicServer(server, options.allowPrivateServers);
  return {
    id: stableId("shadowsocks", server, serverPort, method),
    protocol: "shadowsocks",
    name: name || server,
    server,
    serverPort,
    security: "none",
    transport: { type: "tcp" },
    method,
    password,
    sourceSubscriptionId: options.sourceSubscriptionId,
    sourceSubscriptionName: options.sourceSubscriptionName
  };
}

export function parseClashYaml(input: string, options: ParseOptions = {}): ParseResult {
  const result: ParseResult = { nodes: [], unsupported: [] };
  for (const item of readProxyBlocks(input)) {
    try {
      result.nodes.push(clashProxyToNode(item, options));
    } catch (error) {
      result.unsupported.push({
        input: redact(String(item.name ?? item.server ?? item.type ?? "proxy")),
        reason: errorMessage(error)
      });
    }
  }
  return result;
}

function clashProxyToNode(item: Record<string, string>, options: ParseOptions): CanonicalNode {
  const type = String(item.type ?? "").toLowerCase();
  const server = String(item.server ?? "");
  const serverPort = Number(item.port);
  if (!isValidPort(serverPort)) throw new Error("invalid port");
  assertPublicServer(server, options.allowPrivateServers);
  const transport = fromSimpleTransport(item.network ?? "tcp", {
    host: item["ws-opts.headers.Host"] ?? item["ws-opts.host"] ?? item.host,
    path: item["ws-opts.path"] ?? item.path,
    serviceName: item["grpc-opts.grpc-service-name"] ?? item["grpc-service-name"]
  });
  const security: SecurityType =
    truthy(item.reality) || item["reality-opts.public-key"] ? "reality" : truthy(item.tls) ? "tls" : "none";
  const common = {
    id: stableId(type, server, serverPort, item.uuid ?? item.password ?? item.cipher ?? ""),
    name: String(item.name || server),
    server,
    serverPort,
    security,
    sni: item.servername || item.sni,
    alpn: splitCsv(item.alpn ?? ""),
    transport,
    sourceSubscriptionId: options.sourceSubscriptionId,
    sourceSubscriptionName: options.sourceSubscriptionName
  };
  if (type === "vless") {
    if (!isValidUuid(item.uuid ?? "")) throw new Error("invalid VLESS UUID");
    return {
      ...common,
      protocol: "vless",
      uuid: item.uuid,
      flow: item.flow,
      realityPublicKey: item["reality-opts.public-key"],
      realityShortId: item["reality-opts.short-id"],
      realityFingerprint: item["reality-opts.client-fingerprint"]
    };
  }
  if (type === "vmess") {
    if (!isValidUuid(item.uuid ?? "")) throw new Error("invalid VMess UUID");
    return { ...common, protocol: "vmess", uuid: item.uuid, alterId: Number(item.alterId ?? item.alterid ?? 0), cipher: item.cipher ?? "auto" };
  }
  if (type === "trojan") {
    if (!item.password) throw new Error("trojan password is required");
    return { ...common, protocol: "trojan", password: item.password };
  }
  if (type === "ss") {
    if (!ssMethods.has(item.cipher ?? "")) throw new Error("unsupported Shadowsocks method");
    if (!item.password) throw new Error("Shadowsocks password is required");
    return { ...common, protocol: "shadowsocks", method: item.cipher, password: item.password };
  }
  throw new Error("unsupported Clash proxy type");
}

function readProxyBlocks(input: string): Record<string, string>[] {
  // ponytail: limited Clash YAML reader; use a real YAML parser if full Clash syntax matters.
  const blocks: Record<string, string>[] = [];
  let current: Record<string, string> | undefined;
  let parentKey = "";
  let parentIndent = -1;
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim() === "proxies:") continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const text = line.trim();
    if (text.startsWith("- ")) {
      current = {};
      blocks.push(current);
      parentKey = "";
      parentIndent = -1;
      readYamlPair(text.slice(2), current, "");
      continue;
    }
    if (!current) continue;
    const idx = text.indexOf(":");
    if (idx <= 0) continue;
    const key = text.slice(0, idx).trim();
    const rawValue = text.slice(idx + 1).trim();
    if (!rawValue) {
      parentKey = key;
      parentIndent = indent;
      continue;
    }
    const prefix = parentKey && indent > parentIndent ? `${parentKey}.` : "";
    if (indent <= parentIndent) {
      parentKey = "";
      parentIndent = -1;
    }
    current[prefix + key] = unquote(rawValue);
  }
  return blocks;
}

function readYamlPair(text: string, out: Record<string, string>, prefix: string): void {
  const idx = text.indexOf(":");
  if (idx <= 0) return;
  const key = text.slice(0, idx).trim();
  const rawValue = text.slice(idx + 1).trim();
  if (rawValue) out[prefix + key] = unquote(rawValue);
}

function baseNode(
  protocol: Protocol,
  url: URL,
  serverPort: number,
  security: SecurityType,
  transport: Transport,
  options: ParseOptions
) {
  const server = url.hostname.replace(/^\[|\]$/g, "");
  return {
    id: stableId(protocol, server, serverPort, url.username),
    protocol,
    name: decodeURIComponent(url.hash.slice(1)) || server,
    server,
    serverPort,
    security,
    sni: value(url.searchParams.get("sni") ?? url.searchParams.get("servername")),
    alpn: splitCsv(url.searchParams.get("alpn") ?? ""),
    transport,
    sourceSubscriptionId: options.sourceSubscriptionId,
    sourceSubscriptionName: options.sourceSubscriptionName
  };
}

function readPort(url: URL): number {
  const port = Number(url.port);
  if (!isValidPort(port)) throw new Error("invalid port");
  return port;
}

function safeUrl(uri: string): URL {
  try {
    return new URL(uri);
  } catch (error) {
    if (/:\d{5,}(?:[/?#]|$)/.test(uri)) throw new Error("invalid port");
    throw error;
  }
}

function readSecurity(valueText: string | null): SecurityType {
  const s = (valueText || "none").toLowerCase();
  if (s === "tls" || s === "reality" || s === "none") return s;
  throw new Error("unsupported security mode");
}

function readTransport(params: URLSearchParams): Transport {
  return fromSimpleTransport(params.get("type") ?? "tcp", {
    host: params.get("host") ?? undefined,
    path: params.get("path") ?? undefined,
    serviceName: params.get("serviceName") ?? params.get("service-name") ?? undefined
  });
}

function fromSimpleTransport(type: string, values: { host?: string; path?: string; serviceName?: string }): Transport {
  const t = type.toLowerCase();
  if (!t || t === "tcp") return { type: "tcp" };
  if (t === "ws" || t === "websocket") return { type: "ws", host: value(values.host), path: value(values.path) };
  if (t === "grpc") return { type: "grpc", serviceName: value(values.serviceName) };
  throw new Error("unsupported transport");
}

function splitHostPort(valueText: string): [string, string] {
  if (valueText.startsWith("[")) {
    const end = valueText.indexOf("]");
    return [valueText.slice(1, end), valueText.slice(end + 2)];
  }
  const idx = valueText.lastIndexOf(":");
  return [valueText.slice(0, idx), valueText.slice(idx + 1)];
}

function looksLikeSubscription(text: string): boolean {
  return /^(vless|vmess|trojan|ss):\/\//m.test(text) || looksLikeClashYaml(text);
}

function looksLikeClashYaml(text: string): boolean {
  return /^\s*proxies:\s*$/m.test(text);
}

export function decodeBase64Loose(input: string): string | undefined {
  const compact = input.trim().replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/_=-]+$/.test(compact) || compact.length < 8) return undefined;
  try {
    const normalized = compact.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    return undefined;
  }
}

export function redact(input: string): string {
  return input
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\/\/([^@\s]+)@/g, "//<secret>@")
    .replace(/([?&](?:token|password|pass|pwd)=)[^&#]+/gi, "$1<secret>");
}

function stableId(...parts: unknown[]): string {
  const text = parts.join("|");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function splitCsv(text: string): string[] | undefined {
  const values = text.split(",").map((x) => x.trim()).filter(Boolean);
  return values.length ? values : undefined;
}

function value(text: string | null | undefined): string | undefined {
  return text ? decodeURIComponent(text) : undefined;
}

function truthy(text: string | undefined): boolean {
  return ["true", "1", "yes"].includes(String(text ?? "").toLowerCase());
}

function unquote(text: string): string {
  return text.replace(/^["']|["']$/g, "");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
