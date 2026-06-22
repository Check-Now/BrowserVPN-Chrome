import { NativeClient } from "../native/client";
import { clearChromeProxy, proxyControlLevel, setChromeSocksProxy } from "../proxy/chromeProxy";
import { reduceStatus } from "../proxy/state";
import { allNodes, loadData, saveData, type AppData } from "../storage/store";

const nativeClient = new NativeClient();

chrome.runtime.onInstalled.addListener(async () => {
  const data = await loadData();
  await saveData({ status: data.status ?? { state: "idle" } });
});

chrome.runtime.onMessage.addListener((message: any, _sender: unknown, sendResponse: (value: unknown) => void) => {
  handleMessage(message).then(sendResponse, (error) => sendResponse({ ok: false, error: safeError(error) }));
  return true;
});

async function handleMessage(message: any): Promise<unknown> {
  const data = await loadData();
  if (message?.type === "status") return { ok: true, data: await refreshRuntimeStatus(data) };
  if (message?.type === "diagnostics") {
    const fresh = await refreshRuntimeStatus(data);
    return {
      ok: true,
      data: {
        app: fresh,
        proxyLevel: await proxyControlLevel().catch(() => "unknown"),
        nativeStatus: await nativeClient.status().catch((error) => ({ ok: false, error: safeError(error) })),
        singBoxVersion: await nativeClient.request("version").catch((error) => ({ ok: false, error: safeError(error) }))
      }
    };
  }
  if (message?.type === "testNodes") {
    const ids = Array.isArray(message.nodeIds) ? new Set(message.nodeIds.map(String)) : new Set<string>();
    const nodes = allNodes(data).filter((node) => ids.has(node.id));
    const results = [];
    for (const node of nodes) {
      const response = await nativeClient.test(node).catch((error) => ({ ok: false, error: safeError(error) }));
      results.push({
        nodeId: node.id,
        latency: response.ok && "data" in response && response.data ? response.data.latency : undefined,
        latencyStatus: response.ok && "data" in response && response.data ? response.data.latencyStatus : "failed",
        error: response.ok ? undefined : response.error
      });
    }
    return { ok: true, data: { results } };
  }
  if (message?.type === "connect") {
    const node = allNodes(data).find((x) => x.id === message.nodeId);
    if (!node) throw new Error("请先选择节点。");
    await saveData({ status: reduceStatus(data.status, { type: "connectRequested", nodeId: node.id, nodeName: node.name }) });
    const started = await nativeClient.start(node);
    if (!started.ok || !started.data) {
      await saveData({ status: reduceStatus(data.status, { type: "connectFailed", error: started.error ?? "Native Host 启动失败" }) });
      throw new Error(started.error ?? "Native Host 启动失败");
    }
    await setChromeSocksProxy(started.data.socksPort, data.proxyRules);
    const status = reduceStatus(data.status, {
      type: "connectSucceeded",
      socksHost: started.data.socksHost,
      socksPort: started.data.socksPort
    });
    await saveData({ selectedNodeId: node.id, status });
    return { ok: true, data: status };
  }
  if (message?.type === "disconnect") {
    await clearChromeProxy();
    await nativeClient.stop();
    const status = reduceStatus(data.status, { type: "disconnectRequested" });
    await saveData({ status });
    return { ok: true, data: status };
  }
  throw new Error("unsupported message");
}

async function refreshRuntimeStatus(input?: AppData) {
  const data = input ?? await loadData();
  const response = await nativeClient.status().catch((error) => ({ ok: false, error: safeError(error) }));
  if (!response.ok) {
    const status = { ...data.status, state: "error" as const, error: response.error ?? "Native Host 状态获取失败" };
    await saveData({ status });
    return { ...data, status };
  }
  const nativeStatus = "data" in response ? response.data as { state?: string; socksHost?: string; socksPort?: number; singBoxVersion?: string } | undefined : undefined;
  if (nativeStatus?.state === "running" && nativeStatus.socksHost && nativeStatus.socksPort) {
    const status = {
      ...data.status,
      state: "connected" as const,
      socksHost: nativeStatus.socksHost,
      socksPort: nativeStatus.socksPort,
      error: undefined
    };
    await saveData({ status });
    return { ...data, status };
  }
  if (data.status.state === "connected" || data.status.state === "connecting") {
    await clearChromeProxy().catch(() => undefined);
    const status = { state: "idle" as const };
    await saveData({ status });
    return { ...data, status };
  }
  return data;
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "<uuid>");
}
