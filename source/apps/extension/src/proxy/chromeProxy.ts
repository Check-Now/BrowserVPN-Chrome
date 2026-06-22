import type { ProxyRules } from "../storage/store";

export async function assertProxyControl(): Promise<void> {
  const details = await chrome.proxy.settings.get({ incognito: false });
  const level = details?.levelOfControl;
  if (level !== "controllable_by_this_extension" && level !== "controlled_by_this_extension") {
    throw new Error("Chrome 代理设置当前不受本扩展控制，请检查其他扩展或企业策略。");
  }
}

export async function proxyControlLevel(): Promise<string> {
  const details = await chrome.proxy.settings.get({ incognito: false });
  return String(details?.levelOfControl ?? "unknown");
}

export async function setChromeSocksProxy(port: number, config: ProxyRules = { mode: "all", rules: [] }): Promise<void> {
  await assertProxyControl();
  const rules = config.rules.filter(Boolean);
  if (config.mode === "rules") {
    await chrome.proxy.settings.set({
      scope: "regular",
      value: {
        mode: "pac_script",
        pacScript: { data: buildPacScript(port, rules) }
      }
    });
    return;
  }
  await chrome.proxy.settings.set({
    scope: "regular",
    value: {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "socks5",
          host: "127.0.0.1",
          port
        },
        bypassList: [
          "localhost",
          "127.0.0.1",
          "[::1]",
          "<local>",
          ...(config.mode === "bypass" ? rules : [])
        ]
      }
    }
  });
}

export async function clearChromeProxy(): Promise<void> {
  await chrome.proxy.settings.clear({ scope: "regular" });
}

function buildPacScript(port: number, rules: string[]): string {
  const checks = rules.map((rule) => {
    if (rule.startsWith("*.")) return `shExpMatch(host, ${JSON.stringify(rule)})`;
    return `host === ${JSON.stringify(rule)} || shExpMatch(host, ${JSON.stringify(`*.${rule}`)})`;
  }).join(" || ");
  return `function FindProxyForURL(url, host) {
  host = host.toLowerCase();
  if (${checks || "false"}) return "SOCKS5 127.0.0.1:${port}";
  return "DIRECT";
}`;
}
