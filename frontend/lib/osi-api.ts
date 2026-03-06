/**
 * OSI System Architecture API client.
 * Set NEXT_PUBLIC_OSI_API_URL (e.g. http://localhost:8003) to enable.
 */

export function getOsiApiUrl(): string {
  return (process.env.NEXT_PUBLIC_OSI_API_URL || "http://localhost:8003").trim();
}

export interface LayerInfo {
  layer: number;
  name: string;
  data: string;
  headers_added: Record<string, string | number> | null;
  description: string;
}

export interface SimulateResponse {
  layers: LayerInfo[];
  summary: {
    total_bytes_app: number;
    total_bits_physical: number;
    layers_processed: number;
  };
}

export type SimulateResult =
  | { ok: true; data: SimulateResponse }
  | { ok: false; error: string };

export async function simulateOsiLayers(
  message: string,
  protocol: string = "http"
): Promise<SimulateResult> {
  const baseUrl = getOsiApiUrl();
  try {
    const res = await fetch(`${baseUrl}/osi/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, protocol, direction: "down" }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `Error ${res.status}` };
    }
    const data = (await res.json()) as SimulateResponse;
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backend unreachable";
    return { ok: false, error: msg };
  }
}
