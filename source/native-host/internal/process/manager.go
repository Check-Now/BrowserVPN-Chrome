package process

import (
	"context"
	"errors"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"browservpn/native-host/internal/config"
	"browservpn/native-host/internal/logging"
	"browservpn/native-host/internal/validation"
)

type Status struct {
	State          string `json:"state"`
	SocksHost      string `json:"socksHost,omitempty"`
	SocksPort      int    `json:"socksPort,omitempty"`
	SingBoxVersion string `json:"singBoxVersion,omitempty"`
}

type Manager struct {
	cmd        *exec.Cmd
	configPath string
	socksPort  int
	logger     *logging.Logger
}

func NewManager(logger *logging.Logger) *Manager {
	return &Manager{logger: logger}
}

func (m *Manager) Start(node validation.Node) (Status, error) {
	m.Stop()
	if err := validation.ValidateNode(node, false); err != nil {
		return Status{State: "error"}, err
	}
	port, err := freePort()
	if err != nil {
		return Status{State: "error"}, err
	}
	configPath, err := config.Write(node, port)
	if err != nil {
		return Status{State: "error"}, err
	}
	singBox := singBoxPath()
	if _, err := os.Stat(singBox); err != nil {
		return Status{State: "error"}, errors.New("sing-box.exe was not found; configure BROWSERVPN_SING_BOX or install it under %LOCALAPPDATA%\\BrowserVPN\\bin")
	}
	if err := runCheck(singBox, configPath); err != nil {
		_ = os.Remove(configPath)
		return Status{State: "error"}, err
	}
	cmd := exec.Command(singBox, "run", "-c", configPath)
	configureHidden(cmd)
	if err := cmd.Start(); err != nil {
		_ = os.Remove(configPath)
		return Status{State: "error"}, errors.New("failed to start sing-box")
	}
	m.cmd = cmd
	m.configPath = configPath
	m.socksPort = port
	go func() {
		_ = cmd.Wait()
		m.logger.Add("sing_box_exited")
	}()
	if err := waitListening(port); err != nil {
		m.Stop()
		return Status{State: "error"}, err
	}
	m.logger.Add("started")
	return m.Status(), nil
}

func (m *Manager) Stop() {
	if m.cmd != nil && m.cmd.Process != nil {
		_ = m.cmd.Process.Kill()
	}
	if m.configPath != "" {
		_ = os.Remove(m.configPath)
	}
	m.cmd = nil
	m.configPath = ""
	m.socksPort = 0
	m.logger.Add("stopped")
}

func (m *Manager) Status() Status {
	if m.cmd == nil || m.socksPort == 0 {
		return Status{State: "idle"}
	}
	return Status{State: "running", SocksHost: "127.0.0.1", SocksPort: m.socksPort, SingBoxVersion: m.Version()}
}

func (m *Manager) Version() string {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, singBoxPath(), "version")
	configureHidden(cmd)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "unknown"
	}
	return string(out)
}

func singBoxPath() string {
	if value := os.Getenv("BROWSERVPN_SING_BOX"); value != "" {
		return value
	}
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	return filepath.Join(base, "BrowserVPN", "bin", "sing-box.exe")
}

func runCheck(singBox, configPath string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, singBox, "check", "-c", configPath)
	configureHidden(cmd)
	if err := cmd.Run(); err != nil {
		return errors.New("sing-box check failed")
	}
	return nil
}

func freePort() (int, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer ln.Close()
	return ln.Addr().(*net.TCPAddr).Port, nil
}

func waitListening(port int) error {
	address := net.JoinHostPort("127.0.0.1", strconv.Itoa(port))
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", address, 150*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			return nil
		}
		time.Sleep(100 * time.Millisecond)
	}
	return errors.New("SOCKS5 port did not start listening on 127.0.0.1")
}
