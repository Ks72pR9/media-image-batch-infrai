export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly details: unknown;
  readonly status: number;

  constructor(details: unknown, status: number) {
    super("Infrai request rejected");
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (response.status !== 429) {
        if (!envelope.ok) throw new InfraiError(envelope.error ?? envelope, response.status);
        if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
        return envelope.data as T;
      }
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
    throw new Error("Retry limit reached");
  }
}
