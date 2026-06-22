package config

import (
	"encoding/json"
	"os"
	"path/filepath"

	"browservpn/native-host/internal/validation"
)

func RuntimeDir() (string, error) {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "BrowserVPN", "runtime")
	return dir, os.MkdirAll(dir, 0700)
}

func Write(node validation.Node, socksPort int) (string, error) {
	dir, err := RuntimeDir()
	if err != nil {
		return "", err
	}
	path := filepath.Join(dir, "sing-box.json")
	body, err := json.MarshalIndent(Build(node, socksPort), "", "  ")
	if err != nil {
		return "", err
	}
	return path, os.WriteFile(path, body, 0600)
}

func Build(node validation.Node, socksPort int) map[string]any {
	return map[string]any{
		"log": map[string]any{"level": "warn"},
		"inbounds": []any{
			map[string]any{
				"type":        "socks",
				"tag":         "socks-in",
				"listen":      "127.0.0.1",
				"listen_port": socksPort,
			},
		},
		"outbounds": []any{outbound(node)},
		"route":     map[string]any{"final": "proxy"},
	}
}

func outbound(node validation.Node) map[string]any {
	out := map[string]any{
		"type":        node.Protocol,
		"tag":         "proxy",
		"server":      node.Server,
		"server_port": node.ServerPort,
	}
	switch node.Protocol {
	case "vless":
		out["uuid"] = node.UUID
	case "vmess":
		out["uuid"] = node.UUID
		out["security"] = or(node.Cipher, "auto")
		out["alter_id"] = node.AlterID
	case "trojan":
		out["password"] = node.Password
	case "shadowsocks":
		out["method"] = node.Method
		out["password"] = node.Password
	}
	if tls := tls(node); tls != nil {
		out["tls"] = tls
	}
	if transport := transport(node.Transport); transport != nil {
		out["transport"] = transport
	}
	return out
}

func tls(node validation.Node) map[string]any {
	if node.Security == "" || node.Security == "none" {
		return nil
	}
	t := map[string]any{"enabled": true}
	if node.SNI != "" {
		t["server_name"] = node.SNI
	}
	if len(node.ALPN) > 0 {
		t["alpn"] = node.ALPN
	}
	if node.Security == "reality" {
		t["reality"] = map[string]any{
			"enabled":    true,
			"public_key": node.RealityPublicKey,
			"short_id":   node.RealityShortID,
		}
		if node.RealityFingerprint != "" {
			t["utls"] = map[string]any{"enabled": true, "fingerprint": node.RealityFingerprint}
		}
	}
	return t
}

func transport(in validation.Transport) map[string]any {
	switch in.Type {
	case "", "tcp":
		return nil
	case "ws":
		out := map[string]any{"type": "ws", "path": or(in.Path, "/")}
		if in.Host != "" {
			out["headers"] = map[string]string{"Host": in.Host}
		}
		return out
	case "grpc":
		return map[string]any{"type": "grpc", "service_name": in.ServiceName}
	default:
		return nil
	}
}

func or(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
