//go:build windows

package registry

import "os/exec"

const hostKey = `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.browservpn.host`

func Register(manifestPath string) error {
	return exec.Command("reg.exe", "add", hostKey, "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f").Run()
}

func Unregister() error {
	return exec.Command("reg.exe", "delete", hostKey, "/f").Run()
}
