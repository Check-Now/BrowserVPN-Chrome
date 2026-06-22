import "../shared/styles.css";
import { allNodes, loadData } from "../storage/store";

const app = document.querySelector<HTMLDivElement>("#app")!;

render();

async function render() {
  const data = await loadData();
  const selected = allNodes(data).find((node) => node.id === data.selectedNodeId);
  app.innerHTML = `
    <section class="shell stack">
      <h1>BrowserNode</h1>
      <div class="panel stack">
        <div><strong>当前状态：</strong>${stateText(data.status.state)}</div>
        <div><strong>当前节点：</strong>${escapeHtml(selected?.name ?? data.status.currentNodeName ?? "未选择")}</div>
        <div><strong>协议：</strong>${selected ? selected.protocol.toUpperCase() + " / " + selected.transport.type : "-"}</div>
        <div><strong>SOCKS5：</strong>${data.status.socksHost && data.status.socksPort ? `${data.status.socksHost}:${data.status.socksPort}` : "-"}</div>
        ${data.status.error ? `<div class="danger">${escapeHtml(data.status.error)}</div>` : ""}
        <div class="toolbar">
          <button id="connect" ${!selected || data.status.state === "connecting" ? "disabled" : ""}>连接</button>
          <button id="disconnect" class="secondary">断开</button>
          <button id="options" class="secondary">设置</button>
        </div>
      </div>
      <p class="muted">浏览器代理不等同于全系统 VPN。WebRTC、Secure DNS、企业策略和其他扩展可能影响实际流量。</p>
    </section>
  `;
  document.querySelector("#connect")?.addEventListener("click", () => send({ type: "connect", nodeId: selected?.id }));
  document.querySelector("#disconnect")?.addEventListener("click", () => send({ type: "disconnect" }));
  document.querySelector("#options")?.addEventListener("click", () => chrome.runtime.openOptionsPage());
}

async function send(message: unknown) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) alert(response?.error ?? "操作失败");
  await render();
}

function stateText(state: string): string {
  return { idle: "未连接", connecting: "连接中", connected: "已连接", error: "异常" }[state] ?? state;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]!);
}
