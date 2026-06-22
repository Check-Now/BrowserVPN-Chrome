//go:build !windows

package process

import "os/exec"

func configureHidden(*exec.Cmd) {}
