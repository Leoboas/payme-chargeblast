export type ClientErrorEvent = "payment_request_failed" | "clipboard_failed" | "unhandled_error" | "unhandled_rejection";

const lastSent = new Map<ClientErrorEvent, number>();

// Send only a fixed category: never URLs, query text, customer data, or error messages.
export function reportClientError(event: ClientErrorEvent) {
  const now = Date.now();
  if (now - (lastSent.get(event) ?? 0) < 30_000) return;
  lastSent.set(event, now);
  void fetch("/api/telemetry", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }), keepalive: true,
  }).catch(() => {});
}
