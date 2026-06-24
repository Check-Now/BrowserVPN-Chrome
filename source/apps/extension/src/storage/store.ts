import type { CanonicalNode, RuntimeStatus } from "../shared/types";

export type Language = "zh" | "en";
export type ImportSourceType = "url" | "manual" | "clash";
export type SubscriptionStatus = "normal" | "updating" | "failed";
export type ProxyRuleMode = "all" | "rules" | "bypass";

export interface SubscriptionRecord {
  id: string;
  name: string;
  url?: string;
  sourceType?: ImportSourceType;
  nodes: CanonicalNode[];
  createdAt?: string;
  updatedAt?: string;
  unsupportedCount?: number;
  status?: SubscriptionStatus;
  lastError?: string;
}

export interface ProxyRules {
  mode: ProxyRuleMode;
  rules: string[];
}

export interface AppData {
  subscriptions: SubscriptionRecord[];
  selectedNodeId?: string;
  allowPrivateServers: boolean;
  status: RuntimeStatus;
  language: Language;
  expandedGroupIds: string[];
  proxyRules: ProxyRules;
}

const defaults: AppData = {
  subscriptions: [],
  allowPrivateServers: false,
  status: { state: "idle" },
  language: "zh",
  expandedGroupIds: [],
  proxyRules: { mode: "all", rules: [] }
};

export async function loadData(): Promise<AppData> {
  const value = await chrome.storage.local.get(null);
  const data = { ...defaults, ...value } as AppData;
  return {
    ...data,
    subscriptions: (data.subscriptions ?? []).map((subscription) => ({
      ...subscription,
      sourceType: subscription.sourceType ?? (subscription.url ? "url" : "manual"),
      createdAt: subscription.createdAt ?? subscription.updatedAt,
      unsupportedCount: subscription.unsupportedCount ?? 0,
      status: subscription.status ?? "normal"
    })),
    expandedGroupIds: data.expandedGroupIds ?? [],
    proxyRules: { ...defaults.proxyRules, ...(data.proxyRules ?? {}) }
  };
}

export async function saveData(patch: Partial<AppData>): Promise<void> {
  await chrome.storage.local.set(patch);
}

export function allNodes(data: AppData): CanonicalNode[] {
  return data.subscriptions.flatMap((subscription) =>
    subscription.nodes.map((node) => ({
      ...node,
      sourceSubscriptionId: node.sourceSubscriptionId ?? subscription.id,
      sourceSubscriptionName: node.sourceSubscriptionName ?? subscription.name
    }))
  );
}
