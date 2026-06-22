const privateV4 = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16]
] as const;

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function assertPublicServer(server: string, allowPrivate = false): void {
  const host = server.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) throw new Error("server is required");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("localhost server is blocked");
  }
  if (!allowPrivate && isPrivateAddress(host)) {
    throw new Error("private or local server address is blocked");
  }
}

export function assertSubscriptionUrl(urlText: string): URL {
  const url = new URL(urlText);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("only HTTP/HTTPS subscription URLs are allowed");
  }
  assertPublicServer(url.hostname, false);
  return url;
}

export function isPrivateAddress(host: string): boolean {
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) return true;
  if (host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
    return true;
  }
  const v4 = ipv4ToInt(host);
  if (v4 === undefined) return false;
  return privateV4.some(([base, bits]) => {
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (v4 & mask) === (ipv4ToInt(base)! & mask);
  });
}

function ipv4ToInt(host: string): number | undefined {
  const parts = host.split(".");
  if (parts.length !== 4) return undefined;
  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return undefined;
    const n = Number(part);
    if (n < 0 || n > 255) return undefined;
    result = ((result << 8) | n) >>> 0;
  }
  return result;
}
