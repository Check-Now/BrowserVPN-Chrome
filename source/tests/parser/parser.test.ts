import { describe, expect, it } from "vitest";
import { parseNodeUri, parseSubscription, redact } from "../../apps/extension/src/parser";
import { buildSingBoxConfig } from "../../apps/extension/src/parser/singBox";
import { reduceStatus } from "../../apps/extension/src/proxy/state";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("subscription parser", () => {
  it("parses VLESS TCP + TLS", () => {
    const node = parseNodeUri(`vless://${uuid}@example.com:443?security=tls&sni=example.com#VLESS`);
    expect(node.protocol).toBe("vless");
    expect(node.security).toBe("tls");
    expect(node.transport.type).toBe("tcp");
  });

  it("parses VLESS Reality", () => {
    const node = parseNodeUri(`vless://${uuid}@example.com:443?security=reality&pbk=pub&sid=ab&fp=chrome#Reality`);
    expect(node.protocol).toBe("vless");
    if (node.protocol !== "vless") throw new Error("expected VLESS node");
    expect(node.security).toBe("reality");
    expect(node.realityPublicKey).toBe("pub");
  });

  it("parses VLESS WebSocket", () => {
    const node = parseNodeUri(`vless://${uuid}@example.com:443?security=tls&type=ws&host=cdn.example.com&path=%2Fws#WS`);
    expect(node.transport).toMatchObject({ type: "ws", host: "cdn.example.com", path: "/ws" });
  });

  it("parses VLESS gRPC", () => {
    const node = parseNodeUri(`vless://${uuid}@example.com:443?security=tls&type=grpc&serviceName=svc#gRPC`);
    expect(node.transport).toMatchObject({ type: "grpc", serviceName: "svc" });
  });

  it("parses VMess Base64 JSON", () => {
    const raw = Buffer.from(JSON.stringify({ ps: "VMess", add: "example.com", port: 443, id: uuid, aid: 0, net: "tcp", tls: "tls" })).toString("base64");
    const node = parseNodeUri(`vmess://${raw}`);
    expect(node.protocol).toBe("vmess");
    expect(node.security).toBe("tls");
  });

  it("parses VMess WebSocket", () => {
    const raw = Buffer.from(JSON.stringify({ ps: "VMess WS", add: "example.com", port: 443, id: uuid, net: "ws", tls: "tls", host: "cdn.example.com", path: "/v" })).toString("base64");
    const node = parseNodeUri(`vmess://${raw}`);
    expect(node.transport).toMatchObject({ type: "ws", host: "cdn.example.com", path: "/v" });
  });

  it("parses Trojan TLS", () => {
    const node = parseNodeUri("trojan://secret@example.com:443?security=tls#Trojan");
    expect(node.protocol).toBe("trojan");
    expect(node.security).toBe("tls");
  });

  it("parses Trojan WebSocket", () => {
    const node = parseNodeUri("trojan://secret@example.com:443?security=tls&type=ws&path=%2Ft#TrojanWS");
    expect(node.transport).toMatchObject({ type: "ws", path: "/t" });
  });

  it("parses Shadowsocks AEAD", () => {
    const node = parseNodeUri("ss://aes-256-gcm:pass@example.com:8388#SS");
    expect(node.protocol).toBe("shadowsocks");
    if (node.protocol !== "shadowsocks") throw new Error("expected Shadowsocks node");
    expect(node.method).toBe("aes-256-gcm");
  });

  it("parses multiline URI subscriptions", () => {
    const result = parseSubscription(`vless://${uuid}@example.com:443?security=tls#A\nss://aes-256-gcm:pass@example.org:8388#B`);
    expect(result.nodes).toHaveLength(2);
  });

  it("parses Base64 subscriptions", () => {
    const body = Buffer.from(`vless://${uuid}@example.com:443?security=tls#A`).toString("base64");
    expect(parseSubscription(body).nodes).toHaveLength(1);
  });

  it("parses Clash YAML proxies", () => {
    const result = parseSubscription(`
proxies:
  - name: Clash SS
    type: ss
    server: example.com
    port: 8388
    cipher: aes-256-gcm
    password: pass
`);
    expect(result.nodes[0].protocol).toBe("shadowsocks");
  });

  it("reports unsupported protocols", () => {
    expect(parseSubscription("hysteria2://example.com").unsupported[0].reason).toContain("unsupported");
  });

  it("reports broken Base64 input", () => {
    expect(parseSubscription("not-a-valid-base64").unsupported).toHaveLength(1);
  });

  it("rejects illegal ports", () => {
    expect(() => parseNodeUri(`vless://${uuid}@example.com:99999?security=tls#bad`)).toThrow("invalid port");
  });

  it("rejects illegal UUIDs", () => {
    expect(() => parseNodeUri("vless://bad@example.com:443?security=tls#bad")).toThrow("invalid VLESS UUID");
  });

  it("blocks private IP nodes by default", () => {
    expect(() => parseNodeUri(`vless://${uuid}@192.168.1.1:443?security=tls#private`)).toThrow("private");
  });

  it("generates sing-box JSON", () => {
    const node = parseNodeUri(`vless://${uuid}@example.com:443?security=tls&type=ws&path=%2Fws#A`);
    const config = buildSingBoxConfig(node, 39001);
    expect(JSON.stringify(config)).toContain("\"listen\":\"127.0.0.1\"");
    expect(JSON.stringify(config)).toContain("\"type\":\"vless\"");
  });

  it("redacts subscription URLs, passwords and UUIDs", () => {
    expect(redact(`vless://${uuid}@example.com:443?token=abc`)).not.toContain(uuid);
    expect(redact("trojan://secret@example.com:443")).toContain("//<secret>@");
  });
});

describe("proxy state machine", () => {
  it("connects and disconnects", () => {
    const connecting = reduceStatus({ state: "idle" }, { type: "connectRequested", nodeId: "1", nodeName: "A" });
    expect(connecting.state).toBe("connecting");
    const connected = reduceStatus(connecting, { type: "connectSucceeded", socksHost: "127.0.0.1", socksPort: 30000 });
    expect(connected.state).toBe("connected");
    expect(reduceStatus(connected, { type: "disconnectRequested" }).state).toBe("idle");
  });
});
