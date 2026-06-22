package validation

import (
	"errors"
	"fmt"
	"net"
	"regexp"
	"strings"
)

type Transport struct {
	Type        string `json:"type"`
	Host        string `json:"host,omitempty"`
	Path        string `json:"path,omitempty"`
	ServiceName string `json:"serviceName,omitempty"`
}

type Node struct {
	ID                 string    `json:"id,omitempty"`
	Name               string    `json:"name"`
	Protocol           string    `json:"protocol"`
	Server             string    `json:"server"`
	ServerPort         int       `json:"serverPort"`
	Security           string    `json:"security"`
	SNI                string    `json:"sni,omitempty"`
	ALPN               []string  `json:"alpn,omitempty"`
	Transport          Transport `json:"transport"`
	UUID               string    `json:"uuid,omitempty"`
	Password           string    `json:"password,omitempty"`
	Method             string    `json:"method,omitempty"`
	AlterID            int       `json:"alterId,omitempty"`
	Cipher             string    `json:"cipher,omitempty"`
	Flow               string    `json:"flow,omitempty"`
	RealityPublicKey   string    `json:"realityPublicKey,omitempty"`
	RealityShortID     string    `json:"realityShortId,omitempty"`
	RealityFingerprint string    `json:"realityFingerprint,omitempty"`
}

var uuidPattern = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

var ssMethods = map[string]bool{
	"aes-128-gcm":                   true,
	"aes-192-gcm":                   true,
	"aes-256-gcm":                   true,
	"chacha20-ietf-poly1305":        true,
	"xchacha20-ietf-poly1305":       true,
	"2022-blake3-aes-128-gcm":       true,
	"2022-blake3-aes-256-gcm":       true,
	"2022-blake3-chacha20-poly1305": true,
}

func ValidateNode(node Node, allowPrivate bool) error {
	if node.Name == "" {
		return errors.New("node name is required")
	}
	if node.Server == "" {
		return errors.New("server is required")
	}
	if node.ServerPort < 1 || node.ServerPort > 65535 {
		return errors.New("invalid server port")
	}
	if err := validateServer(node.Server, allowPrivate); err != nil {
		return err
	}
	if node.Security == "" {
		node.Security = "none"
	}
	if node.Security != "none" && node.Security != "tls" && node.Security != "reality" {
		return errors.New("unsupported security mode")
	}
	if node.Transport.Type == "" {
		node.Transport.Type = "tcp"
	}
	if node.Transport.Type != "tcp" && node.Transport.Type != "ws" && node.Transport.Type != "grpc" {
		return errors.New("unsupported transport")
	}
	switch node.Protocol {
	case "vless":
		if !uuidPattern.MatchString(node.UUID) {
			return errors.New("invalid VLESS UUID")
		}
		if node.Security == "reality" && node.RealityPublicKey == "" {
			return errors.New("Reality public key is required")
		}
	case "vmess":
		if !uuidPattern.MatchString(node.UUID) {
			return errors.New("invalid VMess UUID")
		}
	case "trojan":
		if node.Password == "" {
			return errors.New("trojan password is required")
		}
	case "shadowsocks":
		if !ssMethods[node.Method] {
			return errors.New("unsupported Shadowsocks method")
		}
		if node.Password == "" {
			return errors.New("Shadowsocks password is required")
		}
	default:
		return errors.New("unsupported protocol")
	}
	return nil
}

func validateServer(server string, allowPrivate bool) error {
	host := strings.Trim(strings.ToLower(server), "[]")
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return errors.New("localhost server is blocked")
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return nil
	}
	if !allowPrivate && isPrivateIP(ip) {
		return fmt.Errorf("private or local server address is blocked")
	}
	return nil
}

func isPrivateIP(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsUnspecified() || ip.IsPrivate() || ip.IsLinkLocalUnicast()
}
