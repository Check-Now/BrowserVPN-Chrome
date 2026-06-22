package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net"
	"os"
	"os/signal"
	"strconv"
	"time"

	"browernode/native-host/internal/logging"
	"browernode/native-host/internal/messaging"
	"browernode/native-host/internal/process"
	"browernode/native-host/internal/validation"
)

func main() {
	logger := logging.New()
	manager := process.NewManager(logger)
	defer manager.Stop()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	go func() {
		<-stop
		manager.Stop()
		os.Exit(0)
	}()

	for {
		request, err := messaging.Read(os.Stdin)
		if err != nil {
			if errors.Is(err, io.EOF) {
				return
			}
			messaging.Write(os.Stdout, messaging.Error("", "bad_message", "Invalid native message"))
			continue
		}
		response := handle(request, manager, logger)
		messaging.Write(os.Stdout, response)
	}
}

func handle(request messaging.Request, manager *process.Manager, logger *logging.Logger) messaging.Response {
	if request.RequestID == "" {
		return messaging.Error("", "bad_request", "requestId is required")
	}
	switch request.Type {
	case "status":
		return messaging.OK(request.RequestID, manager.Status())
	case "start":
		var payload struct {
			Node validation.Node `json:"node"`
		}
		if err := strictDecode(request.Payload, &payload); err != nil {
			return messaging.Error(request.RequestID, "bad_payload", "Invalid start payload")
		}
		status, err := manager.Start(payload.Node)
		if err != nil {
			logger.Add("start_failed")
			return messaging.Error(request.RequestID, "start_failed", err.Error())
		}
		return messaging.OK(request.RequestID, status)
	case "stop":
		manager.Stop()
		return messaging.OK(request.RequestID, manager.Status())
	case "validate":
		var payload struct {
			Node validation.Node `json:"node"`
		}
		if err := strictDecode(request.Payload, &payload); err != nil {
			return messaging.Error(request.RequestID, "bad_payload", "Invalid validate payload")
		}
		if err := validation.ValidateNode(payload.Node, false); err != nil {
			return messaging.Error(request.RequestID, "invalid_node", err.Error())
		}
		return messaging.OK(request.RequestID, map[string]bool{"valid": true})
	case "test":
		var payload struct {
			Node validation.Node `json:"node"`
		}
		if err := strictDecode(request.Payload, &payload); err != nil {
			return messaging.Error(request.RequestID, "bad_payload", "Invalid test payload")
		}
		if err := validation.ValidateNode(payload.Node, false); err != nil {
			return messaging.Error(request.RequestID, "invalid_node", err.Error())
		}
		latency, err := tcpLatency(payload.Node)
		if err != nil {
			return messaging.Error(request.RequestID, "test_failed", err.Error())
		}
		return messaging.OK(request.RequestID, map[string]any{
			"latency":       latency,
			"latencyStatus": latencyStatus(latency),
		})
	case "logs":
		return messaging.OK(request.RequestID, logger.Recent(50))
	case "version":
		return messaging.OK(request.RequestID, manager.Version())
	default:
		return messaging.Error(request.RequestID, "unsupported_type", "Unsupported request type")
	}
}

func strictDecode(raw json.RawMessage, v any) error {
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}

func tcpLatency(node validation.Node) (int64, error) {
	address := net.JoinHostPort(node.Server, strconv.Itoa(node.ServerPort))
	started := time.Now()
	conn, err := (&net.Dialer{Timeout: 3 * time.Second}).Dial("tcp", address)
	if err != nil {
		return 0, err
	}
	_ = conn.Close()
	ms := time.Since(started).Milliseconds()
	if ms < 1 {
		return 1, nil
	}
	return ms, nil
}

func latencyStatus(latency int64) string {
	if latency < 120 {
		return "good"
	}
	if latency < 260 {
		return "warning"
	}
	return "failed"
}
