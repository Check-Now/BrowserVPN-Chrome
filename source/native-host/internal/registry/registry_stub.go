//go:build !windows

package registry

func Register(string) error {
	return nil
}

func Unregister() error {
	return nil
}
