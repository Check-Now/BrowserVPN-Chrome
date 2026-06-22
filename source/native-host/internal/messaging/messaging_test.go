package messaging

import (
	"bytes"
	"testing"
)

func TestLengthPrefixedRoundTrip(t *testing.T) {
	var buf bytes.Buffer
	err := Write(&buf, OK("req-1", map[string]string{"state": "idle"}))
	if err != nil {
		t.Fatal(err)
	}
	requestBytes := []byte(`{"requestId":"req-1","type":"status","payload":{}}`)
	var in bytes.Buffer
	in.Write([]byte{byte(len(requestBytes)), 0, 0, 0})
	in.Write(requestBytes)
	request, err := Read(&in)
	if err != nil {
		t.Fatal(err)
	}
	if request.RequestID != "req-1" || request.Type != "status" {
		t.Fatalf("unexpected request: %#v", request)
	}
}
