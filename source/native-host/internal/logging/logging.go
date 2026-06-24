package logging

import (
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Logger struct {
	mu      sync.Mutex
	entries []string
}

func New() *Logger {
	return &Logger{}
}

func (l *Logger) Add(code string) {
	entry := time.Now().UTC().Format(time.RFC3339) + " " + code
	l.mu.Lock()
	defer l.mu.Unlock()
	l.entries = append(l.entries, entry)
	if len(l.entries) > 50 {
		l.entries = l.entries[len(l.entries)-50:]
	}
	_ = l.write(entry)
}

func (l *Logger) Recent(max int) []string {
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.entries) <= max {
		return append([]string(nil), l.entries...)
	}
	return append([]string(nil), l.entries[len(l.entries)-max:]...)
}

func (l *Logger) write(entry string) error {
	dir := logDir()
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	path := filepath.Join(dir, "host.log")
	rotate(path)
	file, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.WriteString(entry + "\n")
	return err
}

func rotate(path string) {
	info, err := os.Stat(path)
	if err != nil || info.Size() < 1024*1024 {
		return
	}
	for i := 4; i >= 1; i-- {
		old := path + "." + string(rune('0'+i))
		next := path + "." + string(rune('0'+i+1))
		_ = os.Rename(old, next)
	}
	_ = os.Rename(path, path+".1")
}

func logDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	return filepath.Join(base, "BrowserVPN-Chrome", "logs")
}
