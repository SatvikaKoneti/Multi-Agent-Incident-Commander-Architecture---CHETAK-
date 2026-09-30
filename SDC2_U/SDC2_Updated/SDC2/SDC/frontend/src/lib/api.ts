const TOKEN_KEY = 'hyd.token';
const USER_KEY = 'hyd.user';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hyd.copilot.chat.')) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

type Options = {
  token?: string | null;
  json?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
};

interface Result<T> {
  status: number;
  data: T;
}

async function request<T>(method: string, path: string, options: Options = {}): Promise<Result<T>> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  const token = options.token === undefined ? getToken() : options.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  Object.assign(headers, options.headers);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(0, 'Network error - is the backend running on :4000?');
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      (data as { error?: string })?.error ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return { status: res.status, data: data as T };
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>('GET', path, options),
  post: <T>(path: string, options?: Options) => request<T>('POST', path, options),
  patch: <T>(path: string, options?: Options) => request<T>('PATCH', path, options),
};

export function mediaUrl(p: string | null | undefined): string | null {
  if (!p) return null;
  return `${API_BASE}/${p}`;
}