import "../shared/styles.css";
import { parseSubscription } from "../parser";
import { assertSubscriptionUrl } from "../parser/validation";
import type { CanonicalNode } from "../shared/types";
import {
  allNodes,
  loadData,
  saveData,
  type AppData,
  type ImportSourceType,
  type Language,
  type ProxyRuleMode,
  type SubscriptionRecord
} from "../storage/store";

type ImportTab = ImportSourceType;
type ToastType = "success" | "error" | "warning";
type Toast = { type: ToastType; text: string };

const zh = {
  title: "BrowserNode 设置",
  subtitle: "所有数据仅保存在本机，不读取网页内容。",
  status: "连接状态",
  idle: "未连接",
  connecting: "连接中",
  connected: "已连接",
  error: "异常",
  idleHelp: "尚未选择节点",
  connectingHelp: "正在启动本地代理核心",
  connectedHelp: "Chrome 常规窗口正在使用代理",
  errorHelp: "Native Host 或 sing-box 未正常运行",
  currentNode: "当前节点",
  noNode: "未选择节点",
  regularOnly: "仅常规 Chrome 窗口",
  socks: "本地 SOCKS5",
  connect: "连接",
  disconnect: "断开",
  switchNode: "切换节点",
  selectNodeFirst: "请先选择节点",
  viewDiagnostics: "查看诊断",
  subscription: "订阅管理",
  urlTab: "订阅链接",
  manualTab: "手动节点",
  clashTab: "Clash / Mihomo 配置",
  subName: "订阅名称（可选）",
  subUrl: "订阅 URL",
  manualText: "节点链接",
  clashText: "Clash / Mihomo YAML",
  urlPlaceholder: "https://example.com/sub",
  manualPlaceholder: "支持粘贴多行 VLESS、VMess、Trojan、Shadowsocks 节点链接。",
  clashPlaceholder: "粘贴 Clash / Mihomo YAML 内容，仅解析 proxies 节点列表。",
  importUrl: "导入并解析订阅",
  importManual: "解析并添加节点",
  importClash: "解析 Clash 配置",
  importing: "正在导入...",
  subHelp: "订阅链接仅保存于本机，用于刷新节点列表。",
  parsed: "已解析",
  supported: "支持",
  unsupported: "未支持",
  lastUpdate: "上次更新",
  nodeList: "节点列表",
  favoritesOnly: "仅收藏",
  availableOnly: "可用节点",
  nodes: "个节点",
  subscriptions: "个订阅来源",
  selected: "已选中",
  recent: "最近更新于",
  noRecent: "暂无更新",
  matched: "匹配节点",
  inUse: "正在使用",
  selectedTag: "已选择",
  source: "来源",
  refresh: "刷新",
  test: "测速",
  more: "更多",
  rename: "重命名订阅",
  details: "查看订阅详情",
  deleteSub: "删除订阅",
  expandGroup: "展开本组",
  collapseGroup: "收起本组",
  noNodes: "尚未导入节点",
  noNodesHelp: "请先在“订阅管理”中添加订阅链接、手动节点或 Clash / Mihomo 配置。",
  importNow: "导入订阅",
  noMatch: "无匹配节点",
  noMatchHelp: "请修改搜索条件或清除筛选。",
  clearFilter: "清除筛选",
  noSupported: "此订阅未包含当前版本支持的节点。",
  viewParseDetails: "查看解析详情",
  latencyUnknown: "未测速",
  latencyFailed: "失败",
  favorite: "收藏",
  unfavorite: "取消收藏",
  select: "选择",
  proxyRules: "代理规则",
  modeAll: "全部网页代理",
  modeRules: "按规则代理",
  modeBypass: "默认代理，指定直连",
  modeAllHelp: "Chrome 常规窗口所有网页流量均通过当前节点。",
  modeRulesHelp: "仅匹配下方域名规则的网站走代理，其他网站直连。",
  modeBypassHelp: "默认所有网站走代理，下方规则列表中的网站直连。",
  rules: "域名规则",
  rulesPlaceholder: "google.com\n*.google.com\nyoutube.com\nopenai.com",
  addExamples: "添加示例规则",
  clearRules: "一键清空",
  saveRules: "保存规则",
  unsaved: "未保存修改",
  rulesTip: "规则仅影响 Chrome 常规窗口，不会修改 Windows 系统代理。",
  privacy: "隐私与诊断",
  localStorage: "本地数据存储",
  nativeHost: "Native Host",
  singBox: "sing-box 核心",
  chromeProxy: "Chrome 代理控制",
  proxyScope: "当前代理范围",
  normal: "正常",
  warning: "注意",
  stopped: "未启动",
  running: "运行中",
  connectedNative: "已连接",
  disconnectedNative: "未连接",
  controlled: "当前扩展控制",
  controllable: "可由本扩展控制",
  unknown: "未知",
  clearSubscriptions: "清除订阅与节点",
  localOnly: "所有数据仅保存在本机，不读取网页内容。",
  duplicateConfirm: "已存在相同订阅。确定覆盖？取消将新增一份。",
  switchConfirm: "切换节点会短暂中断当前 Chrome 代理连接。",
  deleteConfirm: "删除后将移除该订阅下的所有节点、测速记录和收藏状态。\n当前正在使用的节点无法直接删除，请先断开连接或切换节点。",
  clearConfirm: "输入 DELETE 确认删除本机保存的订阅、节点、收藏和规则。",
  saved: "已保存",
  testing: "测速中...",
  testDone: "测速完成",
  imported: "订阅保存成功",
  refreshed: "订阅已刷新",
  deleted: "订阅已删除",
  rulesSaved: "代理规则已保存，下次连接时生效。",
  needBackend: "需要 Native Host 增加测速接口，当前不会伪造延迟结果。",
  urlRequired: "请输入订阅 URL",
  textRequired: "请输入节点或配置内容",
  clashMissing: "Clash / Mihomo 配置需要包含 proxies 节点列表",
  emptySubscription: "订阅内容为空",
  invalidRule: "无效规则",
  cannotDeleteActive: "当前正在使用的节点所在订阅无法直接删除。",
  manualSource: "手动添加节点",
  clashSource: "Clash / Mihomo 配置",
  urlSource: "订阅链接"
};

const en: Record<keyof typeof zh, string> = {
  title: "BrowserNode Settings",
  subtitle: "All data stays on this device. Page content is not read.",
  status: "Connection",
  idle: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  error: "Error",
  idleHelp: "No node selected",
  connectingHelp: "Starting local proxy core",
  connectedHelp: "Regular Chrome windows are using the proxy",
  errorHelp: "Native Host or sing-box is not running correctly",
  currentNode: "Current Node",
  noNode: "No node selected",
  regularOnly: "Regular Chrome windows only",
  socks: "Local SOCKS5",
  connect: "Connect",
  disconnect: "Disconnect",
  switchNode: "Switch Node",
  selectNodeFirst: "Select a node first",
  viewDiagnostics: "View Diagnostics",
  subscription: "Subscriptions",
  urlTab: "Subscription URL",
  manualTab: "Manual Nodes",
  clashTab: "Clash / Mihomo Config",
  subName: "Subscription name (optional)",
  subUrl: "Subscription URL",
  manualText: "Node links",
  clashText: "Clash / Mihomo YAML",
  urlPlaceholder: "https://example.com/sub",
  manualPlaceholder: "Paste VLESS, VMess, Trojan, or Shadowsocks links, one per line.",
  clashPlaceholder: "Paste Clash / Mihomo YAML. Only proxies are parsed.",
  importUrl: "Import and Parse",
  importManual: "Parse and Add Nodes",
  importClash: "Parse Clash Config",
  importing: "Importing...",
  subHelp: "Subscription links are stored locally for refreshing node lists.",
  parsed: "Parsed",
  supported: "Supported",
  unsupported: "Unsupported",
  lastUpdate: "Last update",
  nodeList: "Node List",
  favoritesOnly: "Favorites only",
  availableOnly: "Available nodes",
  nodes: "nodes",
  subscriptions: "sources",
  selected: "selected",
  recent: "recently updated",
  noRecent: "no updates",
  matched: "matching nodes",
  inUse: "In use",
  selectedTag: "Selected",
  source: "Source",
  refresh: "Refresh",
  test: "Test",
  more: "More",
  rename: "Rename",
  details: "Details",
  deleteSub: "Delete subscription",
  expandGroup: "Expand group",
  collapseGroup: "Collapse group",
  noNodes: "No nodes imported",
  noNodesHelp: "Add a subscription URL, manual nodes, or a Clash / Mihomo config first.",
  importNow: "Import",
  noMatch: "No matching nodes",
  noMatchHelp: "Change the filters or clear them.",
  clearFilter: "Clear Filters",
  noSupported: "This subscription has no nodes supported by this version.",
  viewParseDetails: "View parse details",
  latencyUnknown: "Not tested",
  latencyFailed: "Failed",
  favorite: "Favorite",
  unfavorite: "Unfavorite",
  select: "Select",
  proxyRules: "Proxy Rules",
  modeAll: "Proxy all pages",
  modeRules: "Proxy by rules",
  modeBypass: "Proxy by default, direct by rules",
  modeAllHelp: "All regular Chrome window traffic uses the current node.",
  modeRulesHelp: "Only matching domains use the proxy. Other sites go direct.",
  modeBypassHelp: "All sites use the proxy by default. Listed domains go direct.",
  rules: "Domain rules",
  rulesPlaceholder: "google.com\n*.google.com\nyoutube.com\nopenai.com",
  addExamples: "Add examples",
  clearRules: "Clear",
  saveRules: "Save Rules",
  unsaved: "Unsaved changes",
  rulesTip: "Rules only affect regular Chrome windows and do not change Windows system proxy.",
  privacy: "Privacy & Diagnostics",
  localStorage: "Local data",
  nativeHost: "Native Host",
  singBox: "sing-box core",
  chromeProxy: "Chrome proxy control",
  proxyScope: "Proxy scope",
  normal: "Normal",
  warning: "Attention",
  stopped: "Stopped",
  running: "Running",
  connectedNative: "Connected",
  disconnectedNative: "Disconnected",
  controlled: "Controlled by this extension",
  controllable: "Controllable by this extension",
  unknown: "Unknown",
  clearSubscriptions: "Clear subscriptions and nodes",
  localOnly: "All data stays on this device. Page content is not read.",
  duplicateConfirm: "A matching subscription exists. OK overwrites it; Cancel adds another copy.",
  switchConfirm: "Switching nodes will briefly interrupt the current Chrome proxy connection.",
  deleteConfirm: "Deleting removes this subscription's nodes, latency records, and favorites.\nDisconnect or switch away before deleting the active node.",
  clearConfirm: "Type DELETE to remove local subscriptions, nodes, favorites, and rules.",
  saved: "Saved",
  testing: "Testing...",
  testDone: "Test complete",
  imported: "Subscription saved",
  refreshed: "Subscription refreshed",
  deleted: "Subscription deleted",
  rulesSaved: "Proxy rules saved. They apply on the next connection.",
  needBackend: "Native Host needs a latency-test API. No fake latency was generated.",
  urlRequired: "Enter a subscription URL",
  textRequired: "Enter nodes or config content",
  clashMissing: "Clash / Mihomo config must contain a proxies list",
  emptySubscription: "Subscription content is empty",
  invalidRule: "Invalid rule",
  cannotDeleteActive: "The subscription containing the active node cannot be deleted.",
  manualSource: "Manual nodes",
  clashSource: "Clash / Mihomo config",
  urlSource: "Subscription URL"
};

const i18n: Record<Language, Record<keyof typeof zh, string>> = { zh, en };
const app = document.querySelector<HTMLDivElement>("#app")!;
const noGroupsExpanded = "__none__";

let data: AppData;
let language: Language = "zh";
let activeTab: ImportTab = "url";
let importBusy = false;
let importResult: { parsed: number; supported: number; unsupported: number; updatedAt: string } | undefined;
let toast: Toast | undefined;
let toastTimer: number | undefined;
let testingGroupId: string | undefined;
let importForm = { name: "", url: "", text: "" };
let rulesDraftMode: ProxyRuleMode = "all";
let rulesDraftText = "";
let rulesDirty = false;

loadAndRender();

app.addEventListener("click", (event) => {
  void handleClick(event);
});

app.addEventListener("input", (event) => {
  handleInput(event);
});

app.addEventListener("change", (event) => {
  handleChange(event);
});

app.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement;
  if (!target.matches("[data-action='toggleGroup']")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  target.click();
});

window.addEventListener("beforeunload", (event) => {
  if (!rulesDirty) return;
  event.preventDefault();
  event.returnValue = "";
});

async function loadAndRender() {
  const response = await sendMessage<AppData>({ type: "status" }).catch(() => undefined);
  data = response?.ok && response.data ? response.data : await loadData();
  language = data.language;
  rulesDraftMode = data.proxyRules.mode;
  rulesDraftText = data.proxyRules.rules.join("\n");
  rulesDirty = false;
  render();
}

function render() {
  const selected = allNodes(data).find((node) => node.id === data.selectedNodeId);
  app.innerHTML = `
    <main class="options-page">
      ${renderBrand()}
      ${renderStatusCard(selected)}
      <section class="main-grid">
        ${renderSubscriptionCard()}
        ${renderNodeListCard()}
      </section>
      <section class="bottom-grid">
        ${renderDiagnosticsCard()}
        ${renderRulesCard()}
      </section>
      ${toast ? `<div class="toast ${toast.type}" role="status">${escapeHtml(toast.text)}</div>` : ""}
    </main>
  `;
}

function renderBrand(): string {
  return `
    <header class="brand-bar">
      <div class="brand-left">
        <div class="brand-icon" aria-hidden="true">${icon("network")}</div>
        <div>
          <h1>${t("title")}</h1>
          <p>${t("subtitle")}</p>
        </div>
      </div>
      <div class="language-switch" aria-label="Language">
        <button data-lang="zh" class="${language === "zh" ? "active" : ""}">中文</button>
        <span>|</span>
        <button data-lang="en" class="${language === "en" ? "active" : ""}">EN</button>
      </div>
    </header>
  `;
}

function renderStatusCard(selected: CanonicalNode | undefined): string {
  const status = data.status.state;
  const connected = status === "connected";
  const connecting = status === "connecting";
  const canConnect = Boolean(selected) && !connecting;
  const current = connected ? allNodes(data).find((node) => node.id === data.status.currentNodeId) ?? selected : selected;
  const detail = current ? nodeDetail(current) : t("regularOnly");
  return `
    <section class="status-card">
      <div class="status-block">
        <span class="status-dot ${status}"></span>
        <div>
          <span class="eyebrow">${t("status")}</span>
          <strong>${stateText(status)}</strong>
          <p>${statusHelp(status)}</p>
        </div>
      </div>
      <div class="status-divider"></div>
      <div class="status-block">
        <span class="status-icon">${icon("globe")}</span>
        <div>
          <span class="eyebrow">${t("currentNode")}</span>
          <strong>${escapeHtml(current?.name ?? t("noNode"))}</strong>
          <p>${escapeHtml(detail)}</p>
          ${connected && data.status.socksHost && data.status.socksPort ? `<p>${t("socks")}: ${data.status.socksHost}:${data.status.socksPort}</p>` : ""}
          ${!selected ? `<p class="hint">${t("selectNodeFirst")}</p>` : ""}
          ${status === "error" && data.status.error ? `<p class="danger">${escapeHtml(data.status.error)}</p>` : ""}
        </div>
      </div>
      <div class="status-actions">
        <button data-action="connect" ${canConnect ? "" : "disabled"}>${connecting ? t("connecting") : connected ? t("switchNode") : t("connect")}</button>
        <button data-action="disconnect" class="secondary" ${connected || connecting ? "" : "disabled"}>${t("disconnect")}</button>
        ${status === "error" ? `<button data-action="scrollDiagnostics" class="secondary">${t("viewDiagnostics")}</button>` : ""}
      </div>
    </section>
  `;
}

function renderSubscriptionCard(): string {
  const buttonText = activeTab === "url" ? t("importUrl") : activeTab === "manual" ? t("importManual") : t("importClash");
  return `
    <section class="panel stack" id="subscription-card">
      <div class="section-title">${icon("cloud")}<h2>${t("subscription")}</h2></div>
      <div class="tabs" role="tablist">
        ${tabButton("url", t("urlTab"))}
        ${tabButton("manual", t("manualTab"))}
        ${tabButton("clash", t("clashTab"))}
      </div>
      <div class="form-grid">
        <label>
          <span>${t("subName")}</span>
          <input data-field="importName" value="${escapeAttr(importForm.name)}" placeholder="${t(activeTab === "manual" ? "manualSource" : activeTab === "clash" ? "clashSource" : "urlSource")}" />
        </label>
        ${activeTab === "url" ? `
          <label>
            <span>${t("subUrl")}</span>
            <input data-field="importUrl" value="${escapeAttr(importForm.url)}" placeholder="${t("urlPlaceholder")}" />
          </label>
        ` : `
          <label>
            <span>${activeTab === "manual" ? t("manualText") : t("clashText")}</span>
            <textarea data-field="importText" placeholder="${escapeAttr(activeTab === "manual" ? t("manualPlaceholder") : t("clashPlaceholder"))}">${escapeHtml(importForm.text)}</textarea>
          </label>
        `}
      </div>
      <button data-action="import" ${importBusy ? "disabled" : ""}>${importBusy ? t("importing") : buttonText}</button>
      <p class="muted">${t("subHelp")}</p>
      ${importResult ? `
        <div class="result-grid">
          <span>${t("parsed")}: <strong>${importResult.parsed}</strong></span>
          <span>${t("supported")}: <strong>${importResult.supported}</strong></span>
          <span>${t("unsupported")}: <strong>${importResult.unsupported}</strong></span>
          <span>${t("lastUpdate")}: <strong>${formatTime(importResult.updatedAt)}</strong></span>
        </div>
      ` : ""}
    </section>
  `;
}

function renderNodeListCard(): string {
  const groups = groupedSubscriptions();
  const selectedCount = data.selectedNodeId ? 1 : 0;
  const lastUpdated = latestUpdated(data.subscriptions);
  return `
    <section class="panel stack">
      <div class="section-heading">
        <div class="section-title">${icon("nodes")}<h2>${t("nodeList")}</h2></div>
      </div>
      <p class="muted">${summaryText(groups, selectedCount, lastUpdated)}</p>
      ${renderGroups(groups)}
    </section>
  `;
}

function renderGroups(groups: SubscriptionRecord[]): string {
  if (!groups.length) {
    return `
      <div class="empty-state">
        <strong>${t("noNodes")}</strong>
        <p>${t("noNodesHelp")}</p>
        <button data-action="focusImport">${t("importNow")}</button>
      </div>
    `;
  }
  return `<div class="group-list">${groups.map((subscription) => renderGroup(subscription)).join("")}</div>`;
}

function renderGroup(subscription: SubscriptionRecord): string {
  const nodes = subscription.nodes;
  const all = subscription.nodes;
  const isConnectedGroup = all.some((node) => node.id === data.status.currentNodeId && data.status.state === "connected");
  const expanded = groupExpanded(subscription);
  const unsupported = subscription.unsupportedCount ?? 0;
  const testing = testingGroupId === subscription.id;
  return `
    <article class="group ${isConnectedGroup ? "active" : ""}">
      <div class="group-header" data-action="toggleGroup" data-subscription="${subscription.id}" tabindex="0">
        <div class="group-main">
          <span class="chevron">${expanded ? "▼" : "▶"}</span>
          <div>
            <div class="group-title">
              <strong>${escapeHtml(subscription.name)}</strong>
              <span>${all.length} ${t("nodes")}</span>
              ${isConnectedGroup ? `<span class="badge blue">${t("inUse")}</span>` : ""}
              ${subscription.status === "failed" ? `<span class="badge red">${t("error")}</span>` : ""}
            </div>
            <p>${t("supported")} ${all.length} · ${t("unsupported")} ${unsupported} · ${t("lastUpdate")} ${formatTime(subscription.updatedAt)} · ${t("source")}: ${escapeHtml(maskSource(subscription))}</p>
          </div>
        </div>
        <div class="group-actions" data-menu-stop="true">
          <button data-action="testGroup" data-subscription="${subscription.id}" class="secondary" ${testing ? "disabled" : ""}>${testing ? t("testing") : t("test")}</button>
        </div>
      </div>
      ${expanded ? renderGroupBody(subscription, nodes) : ""}
    </article>
  `;
}

function renderGroupBody(subscription: SubscriptionRecord, nodes: CanonicalNode[]): string {
  if (!subscription.nodes.length) {
    return `
      <div class="group-empty">
        <p>${t("noSupported")}</p>
        <p>${t("unsupported")} ${subscription.unsupportedCount ?? 0}</p>
      </div>
    `;
  }
  return `<div class="node-table">${sortNodes(nodes).map(renderNodeRow).join("")}</div>`;
}

function renderNodeRow(node: CanonicalNode): string {
  const favorite = data.favoriteNodeIds.includes(node.id);
  const selected = data.selectedNodeId === node.id;
  const connected = data.status.state === "connected" && data.status.currentNodeId === node.id;
  const latency = latencyText(node);
  return `
    <div class="node-row ${selected ? "selected" : ""} ${connected ? "connected" : ""}">
      <span class="latency-dot ${latency.status}"></span>
      <button class="node-name" data-action="selectNode" data-node="${node.id}" title="${escapeAttr(node.name)}">${escapeHtml(node.name)}</button>
      <span class="tag">${protocolLabel(node.protocol)}</span>
      <span class="tag">${escapeHtml(transportLabel(node))}</span>
      <span class="node-region">${escapeHtml(node.sourceSubscriptionName ?? "")}</span>
      <span class="latency ${latency.status}">${escapeHtml(latency.text)}</span>
      ${connected ? `<span class="badge blue">${t("inUse")}</span>` : selected ? `<span class="badge">${t("selectedTag")}</span>` : "<span></span>"}
      <button class="icon-button" data-action="toggleFavorite" data-node="${node.id}" title="${favorite ? t("unfavorite") : t("favorite")}">${favorite ? "★" : "☆"}</button>
    </div>
  `;
}

function renderRulesCard(): string {
  const showRules = rulesDraftMode !== "all";
  return `
    <section class="panel stack">
      <div class="section-title">${icon("shield")}<h2>${t("proxyRules")}</h2></div>
      <div class="segmented">
        ${ruleModeButton("all", t("modeAll"))}
        ${ruleModeButton("rules", t("modeRules"))}
        ${ruleModeButton("bypass", t("modeBypass"))}
      </div>
      <p class="muted">${modeHelp(rulesDraftMode)}</p>
      ${showRules ? `
        <label>
          <span>${t("rules")}</span>
          <textarea data-field="rulesText" placeholder="${escapeAttr(t("rulesPlaceholder"))}">${escapeHtml(rulesDraftText)}</textarea>
        </label>
        <div class="toolbar">
          <button data-action="addRuleExamples" class="secondary">${t("addExamples")}</button>
          <button data-action="clearRules" class="secondary">${t("clearRules")}</button>
          <button data-action="saveRules">${t("saveRules")}</button>
          ${rulesDirty ? `<span class="badge warn">${t("unsaved")}</span>` : ""}
        </div>
      ` : `
        <div class="toolbar">
          <button data-action="saveRules">${t("saveRules")}</button>
          ${rulesDirty ? `<span class="badge warn">${t("unsaved")}</span>` : ""}
        </div>
      `}
      <p class="muted">${t("rulesTip")}</p>
    </section>
  `;
}

function renderDiagnosticsCard(): string {
  const connected = data.status.state === "connected";
  const proxyLabel = data.status.state === "connected" ? t("controlled") : t("controllable");
  const rows = [
    [t("localStorage"), "Chrome storage.local", t("normal"), "ok"],
    [t("nativeHost"), data.status.state === "error" ? t("disconnectedNative") : t("connectedNative"), data.status.state === "error" ? t("error") : t("normal"), data.status.state === "error" ? "bad" : "ok"],
    [t("singBox"), connected ? `${t("running")} · ${data.status.socksHost}:${data.status.socksPort}` : t("stopped"), connected ? t("normal") : t("stopped"), connected ? "ok" : "idle"],
    [t("chromeProxy"), proxyLabel, t("normal"), "ok"],
    [t("socks"), connected ? `${data.status.socksHost}:${data.status.socksPort}` : t("stopped"), connected ? t("normal") : t("stopped"), connected ? "ok" : "idle"],
    [t("proxyScope"), t("regularOnly"), t("normal"), "ok"]
  ];
  return `
    <section class="panel stack" id="diagnostics-card">
      <div class="section-title">${icon("diagnostics")}<h2>${t("privacy")}</h2></div>
      <div class="diagnostic-table">
        ${rows.map(([name, value, status, tone]) => `
          <div>
            <span>${name}</span>
            <strong>${value}</strong>
            <em class="${tone}">${status}</em>
          </div>
        `).join("")}
      </div>
      <div class="toolbar">
        <button data-action="clearSubscriptions" class="danger-button">${t("clearSubscriptions")}</button>
      </div>
      <p class="muted">${t("localOnly")}</p>
    </section>
  `;
}

async function handleClick(event: Event) {
  const target = event.target as HTMLElement;
  const langButton = target.closest<HTMLButtonElement>("[data-lang]");
  if (langButton?.dataset.lang) {
    language = langButton.dataset.lang as Language;
    await patchData({ language });
    render();
    return;
  }
  const actionTarget = target.closest<HTMLElement>("[data-action]");
  if (!actionTarget) return;
  if (target.closest("[data-menu-stop]") && actionTarget.dataset.action === "toggleGroup") return;
  const action = actionTarget.dataset.action;
  const subscriptionId = actionTarget.dataset.subscription;
  const nodeId = actionTarget.dataset.node;
  if (action === "connect") return connectSelected();
  if (action === "disconnect") return disconnect();
  if (action === "scrollDiagnostics") return scrollToDiagnostics();
  if (action === "import") return importSubscription();
  if (action === "focusImport") return focusImport();
  if (action === "testGroup" && subscriptionId) return testGroup(subscriptionId);
  if (action === "toggleGroup" && subscriptionId) return toggleGroup(subscriptionId);
  if (action === "selectNode" && nodeId) return selectNode(nodeId);
  if (action === "toggleFavorite" && nodeId) return toggleFavorite(nodeId);
  if (action === "ruleMode") return setRuleMode(actionTarget.dataset.mode as ProxyRuleMode);
  if (action === "addRuleExamples") return addRuleExamples();
  if (action === "clearRules") return clearRuleDraft();
  if (action === "saveRules") return saveRules();
  if (action === "clearSubscriptions") return clearSubscriptions();
  if (action === "tab") {
    activeTab = actionTarget.dataset.tab as ImportTab;
    importResult = undefined;
    render();
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const field = target.dataset.field;
  if (field === "importName") importForm.name = target.value;
  if (field === "importUrl") importForm.url = target.value;
  if (field === "importText") importForm.text = target.value;
  if (field === "rulesText") {
    rulesDraftText = target.value;
    rulesDirty = true;
  }
}

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const field = target.dataset.field;
  if (field) render();
}

async function importSubscription() {
  if (importBusy) return;
  importBusy = true;
  render();
  try {
    const sourceType = activeTab;
    const name = importForm.name.trim() || defaultSubscriptionName(sourceType);
    const duplicate = findDuplicate(name, sourceType, importForm.url.trim());
    const overwrite = duplicate ? confirm(t("duplicateConfirm")) : false;
    const id = overwrite && duplicate ? duplicate.id : crypto.randomUUID();
    const body = await importBody(sourceType);
    if (!body.trim()) throw new Error(t("emptySubscription"));
    if (sourceType === "clash" && !/^\s*proxies:\s*$/m.test(body)) throw new Error(t("clashMissing"));
    const parsed = parseSubscription(body, {
      allowPrivateServers: false,
      sourceSubscriptionId: id,
      sourceSubscriptionName: name
    });
    const now = new Date().toISOString();
    const record: SubscriptionRecord = {
      id,
      name,
      sourceType,
      url: sourceType === "url" ? importForm.url.trim() : undefined,
      nodes: parsed.nodes,
      createdAt: duplicate?.createdAt ?? now,
      updatedAt: now,
      unsupportedCount: parsed.unsupported.length,
      status: "normal"
    };
    const subscriptions = overwrite && duplicate
      ? data.subscriptions.map((item) => item.id === duplicate.id ? record : item)
      : [...data.subscriptions, record];
    importResult = { parsed: parsed.nodes.length + parsed.unsupported.length, supported: parsed.nodes.length, unsupported: parsed.unsupported.length, updatedAt: now };
    await patchData({ subscriptions, expandedGroupIds: [id, ...data.expandedGroupIds.filter((x) => x !== id && x !== noGroupsExpanded)] });
    showToast("success", t("imported"));
  } catch (error) {
    showToast("error", safeError(error));
  } finally {
    importBusy = false;
    render();
  }
}

async function importBody(sourceType: ImportSourceType): Promise<string> {
  if (sourceType === "url") {
    const url = importForm.url.trim();
    if (!url) throw new Error(t("urlRequired"));
    const parsed = assertSubscriptionUrl(url);
    await requestHostPermission(parsed);
    return fetchSubscription(url);
  }
  if (!importForm.text.trim()) throw new Error(t("textRequired"));
  return importForm.text;
}

async function testGroup(id: string) {
  const subscription = data.subscriptions.find((item) => item.id === id);
  if (!subscription || !subscription.nodes.length) return;
  testingGroupId = id;
  render();
  try {
    const response = await sendMessage<{
      results: Array<{ nodeId: string; latency?: number; latencyStatus: "unknown" | "good" | "warning" | "failed" }>;
    }>({ type: "testNodes", nodeIds: subscription.nodes.map((node) => node.id) });
    if (!response.ok || !response.data) throw new Error(response.error ?? t("error"));
    const results = new Map(response.data.results.map((result) => [result.nodeId, result]));
    await updateSubscription(id, {
      nodes: subscription.nodes.map((node) => {
        const result = results.get(node.id);
        return result ? { ...node, latency: result.latency, latencyStatus: result.latencyStatus } : node;
      })
    });
    showToast("success", t("testDone"));
  } catch (error) {
    showToast("error", safeError(error));
  } finally {
    testingGroupId = undefined;
    render();
  }
}

async function connectSelected() {
  const selected = data.selectedNodeId;
  if (!selected) return showToast("warning", t("selectNodeFirst"));
  if (data.status.state === "connected" && data.status.currentNodeId !== selected && !confirm(t("switchConfirm"))) return;
  if (data.status.state === "connected" && data.status.currentNodeId === selected) return showToast("success", t("connected"));
  data.status = { ...data.status, state: "connecting" };
  render();
  const response = await sendMessage({ type: "connect", nodeId: selected });
  if (!response.ok) showToast("error", response.error ?? t("error"));
  await loadAndRender();
}

async function disconnect() {
  const response = await sendMessage({ type: "disconnect" });
  if (!response.ok) showToast("error", response.error ?? t("error"));
  await loadAndRender();
}

async function selectNode(nodeId: string) {
  await patchData({ selectedNodeId: nodeId });
  showToast("success", t("selectedTag"));
}

async function toggleFavorite(nodeId: string) {
  const favorites = new Set(data.favoriteNodeIds);
  favorites.has(nodeId) ? favorites.delete(nodeId) : favorites.add(nodeId);
  await patchData({ favoriteNodeIds: [...favorites] });
}

async function setGroup(id: string, expanded: boolean) {
  const ids = new Set(data.expandedGroupIds);
  ids.delete(noGroupsExpanded);
  expanded ? ids.add(id) : ids.delete(id);
  if (!expanded && !ids.size) ids.add(noGroupsExpanded);
  await patchData({ expandedGroupIds: [...ids] });
}

async function toggleGroup(id: string) {
  await setGroup(id, !data.expandedGroupIds.includes(id));
}

async function saveRules() {
  const cleaned = cleanRules(rulesDraftText);
  if (cleaned.invalid.length) {
    showToast("error", `${t("invalidRule")}: ${cleaned.invalid[0]}`);
    return;
  }
  const proxyRules = { mode: rulesDraftMode, rules: cleaned.rules };
  rulesDraftText = cleaned.rules.join("\n");
  rulesDirty = false;
  await patchData({ proxyRules });
  showToast("success", t("rulesSaved"));
}

function setRuleMode(mode: ProxyRuleMode | undefined) {
  if (!mode) return;
  rulesDraftMode = mode;
  rulesDirty = true;
  render();
}

function addRuleExamples() {
  rulesDraftText = [rulesDraftText, "google.com", "*.google.com", "youtube.com", "openai.com"].filter(Boolean).join("\n");
  rulesDirty = true;
  render();
}

function clearRuleDraft() {
  rulesDraftText = "";
  rulesDirty = true;
  render();
}

async function clearSubscriptions() {
  if (prompt(t("clearConfirm")) !== "DELETE") return;
  await patchData({
    subscriptions: [],
    selectedNodeId: undefined,
    favoriteNodeIds: [],
    expandedGroupIds: [],
    proxyRules: { mode: "all", rules: [] }
  });
  rulesDraftMode = "all";
  rulesDraftText = "";
  rulesDirty = false;
  showToast("success", t("saved"));
}

function focusImport() {
  document.querySelector<HTMLElement>("#subscription-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToDiagnostics() {
  document.querySelector<HTMLElement>("#diagnostics-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function updateSubscription(id: string, patch: Partial<SubscriptionRecord>) {
  await patchData({
    subscriptions: data.subscriptions.map((subscription) => subscription.id === id ? { ...subscription, ...patch } : subscription)
  });
}

async function patchData(patch: Partial<AppData>) {
  data = { ...data, ...patch };
  await saveData(patch);
  render();
}

async function requestHostPermission(url: URL) {
  const origin = `${url.protocol}//${url.host}/*`;
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) throw new Error(language === "zh" ? "未授予订阅域名权限" : "Subscription host permission was not granted");
}

async function fetchSubscription(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(language === "zh" ? "订阅下载失败" : "Subscription download failed");
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 5 * 1024 * 1024) throw new Error(language === "zh" ? "订阅超过 5 MB" : "Subscription exceeds 5 MB");
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}

function groupedSubscriptions(): SubscriptionRecord[] {
  return [...data.subscriptions].sort((a, b) => sourceOrder(a.sourceType) - sourceOrder(b.sourceType));
}

function sortNodes(nodes: CanonicalNode[]): CanonicalNode[] {
  return [...nodes].sort((a, b) => scoreNode(b) - scoreNode(a) || a.name.localeCompare(b.name));
}

function scoreNode(node: CanonicalNode): number {
  let score = 0;
  if (data.status.currentNodeId === node.id) score += 1000;
  if (data.selectedNodeId === node.id) score += 500;
  if (data.favoriteNodeIds.includes(node.id)) score += 100;
  const latency = (node as CanonicalNode & { latency?: number }).latency;
  if (typeof latency === "number") score += Math.max(0, 100 - latency / 10);
  return score;
}

function groupExpanded(subscription: SubscriptionRecord): boolean {
  if (data.expandedGroupIds.includes(noGroupsExpanded)) return false;
  if (data.expandedGroupIds.length) return data.expandedGroupIds.includes(subscription.id);
  const selectedOrConnected = subscription.nodes.some((node) => node.id === data.selectedNodeId || node.id === data.status.currentNodeId);
  return selectedOrConnected || subscription.id === latestSubscriptionId();
}

function findDuplicate(name: string, sourceType: ImportSourceType, url: string): SubscriptionRecord | undefined {
  return data.subscriptions.find((subscription) => {
    if (sourceType === "url" && subscription.url && url) return subscription.url === url;
    return subscription.sourceType === sourceType && subscription.name === name;
  });
}

function defaultSubscriptionName(sourceType: ImportSourceType): string {
  if (sourceType === "manual") return t("manualSource");
  if (sourceType === "clash") return t("clashSource");
  return t("urlSource");
}

function cleanRules(text: string): { rules: string[]; invalid: string[] } {
  const rules: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const value = raw.trim().toLowerCase();
    if (!value || rules.includes(value)) continue;
    if (!/^(\*\.)?([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(value)) invalid.push(value);
    else rules.push(value);
  }
  return { rules, invalid };
}

function tabButton(tab: ImportTab, label: string): string {
  return `<button data-action="tab" data-tab="${tab}" class="${activeTab === tab ? "active" : ""}" role="tab">${label}</button>`;
}

function ruleModeButton(mode: ProxyRuleMode, label: string): string {
  return `<button data-action="ruleMode" data-mode="${mode}" class="${rulesDraftMode === mode ? "active" : ""}">${label}</button>`;
}

function modeHelp(mode: ProxyRuleMode): string {
  if (mode === "rules") return t("modeRulesHelp");
  if (mode === "bypass") return t("modeBypassHelp");
  return t("modeAllHelp");
}

function summaryText(groups: SubscriptionRecord[], selectedCount: number, lastUpdated: string | undefined): string {
  const count = groups.reduce((sum, group) => sum + group.nodes.length, 0);
  return `${count} ${t("nodes")} · ${groups.length} ${t("subscriptions")} · ${t("selected")} ${selectedCount} ${t("nodes")} · ${t("recent")} ${formatTime(lastUpdated)}`;
}

function latestSubscriptionId(): string | undefined {
  return data.subscriptions.reduce((latest, item) => {
    if (!latest) return item;
    return String(item.updatedAt ?? "") > String(latest.updatedAt ?? "") ? item : latest;
  }, undefined as SubscriptionRecord | undefined)?.id;
}

function latestUpdated(subscriptions: SubscriptionRecord[]): string | undefined {
  return subscriptions.map((item) => item.updatedAt).filter(Boolean).sort().at(-1);
}

function sourceOrder(type?: ImportSourceType): number {
  return type === "url" ? 0 : type === "manual" ? 1 : 2;
}

function stateText(state: string): string {
  return state === "connecting" ? t("connecting") : state === "connected" ? t("connected") : state === "error" ? t("error") : t("idle");
}

function statusHelp(state: string): string {
  return state === "connecting" ? t("connectingHelp") : state === "connected" ? t("connectedHelp") : state === "error" ? t("errorHelp") : t("idleHelp");
}

function protocolLabel(protocolValue: string): string {
  return protocolValue === "shadowsocks" ? "SS" : protocolValue.toUpperCase();
}

function transportLabel(node: CanonicalNode): string {
  const values = [
    node.security === "none" ? "" : node.security,
    node.transport.type === "tcp" ? "" : node.transport.type
  ].filter(Boolean);
  return values.length ? values.map((value) => value.toUpperCase()).join(" · ") : "TCP";
}

function nodeDetail(node: CanonicalNode): string {
  return `${protocolLabel(node.protocol)} · ${transportLabel(node)}`;
}

function latencyText(node: CanonicalNode): { text: string; status: "unknown" | "good" | "warning" | "failed" } {
  const measured = node as CanonicalNode & { latency?: number; latencyStatus?: "unknown" | "good" | "warning" | "failed" };
  if (measured.latencyStatus === "failed") return { text: t("latencyFailed"), status: "failed" };
  const value = measured.latency;
  if (typeof value !== "number") return { text: t("latencyUnknown"), status: "unknown" };
  if (value < 120) return { text: `${value}ms`, status: "good" };
  if (value < 260) return { text: `${value}ms`, status: "warning" };
  return { text: `${value}ms`, status: "failed" };
}

function maskSource(subscription: SubscriptionRecord): string {
  if (subscription.sourceType === "manual") return t("manualSource");
  if (subscription.sourceType === "clash") return t("clashSource");
  return subscription.url ? maskUrl(subscription.url) : t("urlSource");
}

function maskUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${maskHost(url.hostname)}${url.pathname && url.pathname !== "/" ? "/••••" : ""}`;
  } catch {
    return redact(value);
  }
}

function maskHost(host: string): string {
  const parts = host.split(".");
  if (parts.length < 2) return host;
  return `${parts[0].slice(0, 8)}••••.${parts.at(-1)}`;
}

function formatTime(value: string | undefined): string {
  if (!value) return t("noRecent");
  try {
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function showToast(type: ToastType, text: string) {
  toast = { type, text };
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast = undefined;
    render();
  }, 3200);
  render();
}

async function sendMessage<T = unknown>(message: unknown): Promise<{ ok: boolean; data?: T; error?: string }> {
  return chrome.runtime.sendMessage(message);
}

function t(key: keyof typeof zh): string {
  return i18n[language][key];
}

function safeError(error: unknown): string {
  return redact(error instanceof Error ? error.message : String(error));
}

function redact(value: string): string {
  return value
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\/\/([^@\s]+)@/g, "//<secret>@")
    .replace(/([?&](?:token|password|pass|pwd)=)[^&#]+/gi, "$1<secret>");
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]!);
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function icon(name: "network" | "globe" | "cloud" | "nodes" | "refresh" | "shield" | "diagnostics"): string {
  const common = `width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  const paths: Record<typeof name, string> = {
    network: `<circle cx="12" cy="12" r="3"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h2M15 12h2M12 7v2M12 15v2"/>`,
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
    cloud: `<path d="M6 18h11a4 4 0 0 0 0-8 6 6 0 0 0-11.5-1.5A4.8 4.8 0 0 0 6 18Z"/>`,
    nodes: `<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11 6 17M12 11l6 6"/>`,
    refresh: `<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M19 11a7 7 0 0 0-12-4M5 13a7 7 0 0 0 12 4"/>`,
    shield: `<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>`,
    diagnostics: `<path d="M12 3v18M5 8h14M7 16h10"/><circle cx="12" cy="12" r="9"/>`
  };
  return `<svg ${common} aria-hidden="true">${paths[name]}</svg>`;
}
