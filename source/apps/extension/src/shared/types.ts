export type Protocol = "vless" | "vmess" | "trojan" | "shadowsocks";
export type TransportType = "tcp" | "ws" | "grpc";
export type SecurityType = "none" | "tls" | "reality";

export interface Transport {
  type: TransportType;
  host?: string;
  path?: string;
  serviceName?: string;
}

export interface BaseNode {
  id: string;
  name: string;
  protocol: Protocol;
  server: string;
  serverPort: number;
  security: SecurityType;
  sni?: string;
  alpn?: string[];
  transport: Transport;
  sourceSubscriptionId?: string;
  sourceSubscriptionName?: string;
  latency?: number;
  latencyStatus?: "unknown" | "good" | "warning" | "failed";
}

export interface VlessNode extends BaseNode {
  protocol: "vless";
  uuid: string;
  flow?: string;
  realityPublicKey?: string;
  realityShortId?: string;
  realityFingerprint?: string;
}

export interface VmessNode extends BaseNode {
  protocol: "vmess";
  uuid: string;
  alterId?: number;
  cipher?: string;
}

export interface TrojanNode extends BaseNode {
  protocol: "trojan";
  password: string;
}

export interface ShadowsocksNode extends BaseNode {
  protocol: "shadowsocks";
  method: string;
  password: string;
}

export type CanonicalNode =
  | VlessNode
  | VmessNode
  | TrojanNode
  | ShadowsocksNode;

export interface UnsupportedNode {
  input: string;
  reason: string;
}

export interface ParseResult {
  nodes: CanonicalNode[];
  unsupported: UnsupportedNode[];
}

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

export interface RuntimeStatus {
  state: ConnectionState;
  currentNodeId?: string;
  currentNodeName?: string;
  socksHost?: string;
  socksPort?: number;
  error?: string;
}
