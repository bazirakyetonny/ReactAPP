export interface SDTError {
  Message: string;
  Type: string;
}

export class AuthError extends Error {
  constructor() {
    super("Not Authenticated");
    this.name = "AuthError";
  }
}

export function getBaseUrl(): string {
  return import.meta.env.VITE_BASE_URL ?? window.location.origin;
}

function checkError(error: SDTError | undefined): void {
  if (!error) return;
  if (error.Message === "Not Authenticated") throw new AuthError();
  if (error.Message) throw new Error(error.Message);
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  let url = `${getBaseUrl()}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const data = await res.json();
  checkError(data.error);
  return data as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const data = await res.json();
  checkError(data.error);
  return data as T;
}
