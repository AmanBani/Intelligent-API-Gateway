/**
 * API Gateway client – only talks to the real backend.
 * Set NEXT_PUBLIC_API_GATEWAY_URL or NEXT_PUBLIC_API_URL (e.g. http://localhost:8000) to enable.
 */

export function getGatewayUrl(): string {
  const url =
    (process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  return url;
}

export async function login(gatewayUrl: string, username: string): Promise<string> {
  const res = await fetch(`${gatewayUrl}/login?username=${encodeURIComponent(username)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export interface HelloResponse {
  service: string;
  message: string;
}

export type GatewayHelloResult =
  | { ok: true; status: number; data: HelloResponse }
  | { ok: false; status: number; detail: string };

export async function sendHello(
  gatewayUrl: string,
  token: string
): Promise<GatewayHelloResult> {
  const res = await fetch(`${gatewayUrl}/hello`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (res.status === 429) {
    return { ok: false, status: 429, detail: text || "Too many requests. Try again later." };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, detail: text || `Error ${res.status}` };
  }
  try {
    const data = JSON.parse(text) as HelloResponse;
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: true, status: res.status, data: { service: "Server", message: text } };
  }
}
