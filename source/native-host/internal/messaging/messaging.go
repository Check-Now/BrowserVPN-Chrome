package messaging

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
)

const maxMessageSize = 1024 * 1024

type Request struct {
	RequestID string          `json:"requestId"`
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
}

type Response struct {
	RequestID string `json:"requestId"`
	OK        bool   `json:"ok"`
	Data      any    `json:"data,omitempty"`
	Error     string `json:"error,omitempty"`
	Code      string `json:"code,omitempty"`
}

func Read(r io.Reader) (Request, error) {
	var size uint32
	if err := binary.Read(r, binary.LittleEndian, &size); err != nil {
		return Request{}, err
	}
	if size == 0 || size > maxMessageSize {
		return Request{}, errors.New("invalid native message size")
	}
	body := make([]byte, size)
	if _, err := io.ReadFull(r, body); err != nil {
		return Request{}, err
	}
	var request Request
	if err := json.Unmarshal(body, &request); err != nil {
		return Request{}, err
	}
	if len(request.Payload) == 0 {
		request.Payload = []byte("{}")
	}
	return request, nil
}

func Write(w io.Writer, response Response) error {
	body, err := json.Marshal(response)
	if err != nil {
		return err
	}
	if len(body) > maxMessageSize {
		return errors.New("response too large")
	}
	if err := binary.Write(w, binary.LittleEndian, uint32(len(body))); err != nil {
		return err
	}
	_, err = w.Write(body)
	return err
}

func OK(requestID string, data any) Response {
	return Response{RequestID: requestID, OK: true, Data: data}
}

func Error(requestID, code, message string) Response {
	return Response{RequestID: requestID, OK: false, Code: code, Error: message}
}
