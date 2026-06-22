//go:build windows

package process

import (
	"os/exec"
	"syscall"
)

func configureHidden(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
}
