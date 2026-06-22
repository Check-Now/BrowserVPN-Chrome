import type { CanonicalNode } from "../shared/types";

const hostName = "com.browservpn.host";

export interface NativeResponse<T = unknown> {
  requestId: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export class NativeClient {
  private port?: any;
  private pending = new Map<string, (response: NativeResponse) => void>();

  connect(): void {
    if (this.port) return;
    this.port = chrome.runtime.connectNative(hostName);
    this.port.onMessage.addListener((message: NativeResponse) => {
      const done = this.pending.get(message.requestId);
      if (done) {
        this.pending.delete(message.requestId);
        done(message);
      }
    });
    this.port.onDisconnect.addListener(() => {
      this.port = undefined;
      for (const done of this.pending.values()) done({ requestId: "", ok: false, error: "Native Host 已断开" });
      this.pending.clear();
    });
  }

  request<T>(type: string, payload: Record<string, unknown> = {}): Promise<NativeResponse<T>> {
    this.connect();
    const requestId = crypto.randomUUID();
    const message = { requestId, type, payload };
    return new Promise((resolve) => {
      this.pending.set(requestId, resolve as (response: NativeResponse) => void);
      this.port.postMessage(message);
    });
  }

  status() {
    return this.request("status");
  }

  start(node: CanonicalNode) {
    return this.request<{ state: string; socksHost: string; socksPort: number }>("start", { node: toNativeNode(node) });
  }

  validate(node: CanonicalNode) {
    return this.request<{ valid: boolean }>("validate", { node: toNativeNode(node) });
  }

  test(node: CanonicalNode) {
    return this.request<{ latency: number; latencyStatus: "good" | "warning" | "failed" }>("test", { node: toNativeNode(node) });
  }

  stop() {
    return this.request("stop");
  }
}

function toNativeNode(node: CanonicalNode): Record<string, unknown> {
  const base = {
    id: node.id,
    name: node.name,
    protocol: node.protocol,
    server: node.server,
    serverPort: node.serverPort,
    security: node.security,
    sni: node.sni,
    alpn: node.alpn,
    transport: node.transport
  };
  if (node.protocol === "vless") {
    return {
      ...base,
      uuid: node.uuid,
      flow: node.flow,
      realityPublicKey: node.realityPublicKey,
      realityShortId: node.realityShortId,
      realityFingerprint: node.realityFingerprint
    };
  }
  if (node.protocol === "vmess") {
    return { ...base, uuid: node.uuid, alterId: node.alterId, cipher: node.cipher };
  }
  if (node.protocol === "trojan") {
    return { ...base, password: node.password };
  }
  return { ...base, method: node.method, password: node.password };
}
