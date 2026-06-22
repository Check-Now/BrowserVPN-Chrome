import type { ConnectionState, RuntimeStatus } from "../shared/types";

export type ProxyEvent =
  | { type: "connectRequested"; nodeId: string; nodeName: string }
  | { type: "connectSucceeded"; socksHost: string; socksPort: number }
  | { type: "connectFailed"; error: string }
  | { type: "disconnectRequested" }
  | { type: "coreExited"; error: string };

export function reduceStatus(status: RuntimeStatus, event: ProxyEvent): RuntimeStatus {
  if (event.type === "connectRequested") {
    return { state: "connecting", currentNodeId: event.nodeId, currentNodeName: event.nodeName };
  }
  if (event.type === "connectSucceeded") {
    return { ...status, state: "connected", socksHost: event.socksHost, socksPort: event.socksPort, error: undefined };
  }
  if (event.type === "disconnectRequested") return { state: "idle" };
  if (event.type === "coreExited") return { ...status, state: "error", error: event.error, socksHost: undefined, socksPort: undefined };
  return { ...status, state: "error" as ConnectionState, error: event.error };
}
