import { Platform } from 'react-native';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_SERVER_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

const SERVER_API_URL =
  Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_SERVER_API_URL_WEB ??
      process.env.EXPO_PUBLIC_SERVER_API_URL ??
      'http://localhost:3001')
    : (Platform.OS === 'android'
      ? (process.env.EXPO_PUBLIC_SERVER_API_URL_ANDROID ??
        process.env.EXPO_PUBLIC_SERVER_API_URL ??
        DEFAULT_SERVER_API_URL)
      : (process.env.EXPO_PUBLIC_SERVER_API_URL ?? DEFAULT_SERVER_API_URL));

type GetToken = () => Promise<string | null>;

export type ApiList = {
  id: number;
  user_id?: string;
  title: string;
  description: string | null;
  is_public?: boolean;
  cover_image?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiListRow = ApiList & {
  item_count?: string;
};

export type ApiItem = {
  id: number;
  list_id: number;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_url?: string | null;
  source_type: string | null;
  metadata?: unknown;
  position?: number;
  created_at?: string;
  updated_at?: string;
};

type ErrorPayload = { error?: string; message?: string };

async function apiFetchJson<T>(
  getToken: GetToken,
  path: string,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...init?.headers,
  };

  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  let text: string;
  try {
    res = await fetch(`${SERVER_API_URL}${path}`, { ...init, headers, signal: controller.signal });
    text = await res.text();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, null);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  const payload = text.length ? safeJsonParse(text) : null;

  if (!res.ok) {
    const message = getErrorMessage(payload) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as ErrorPayload;
  if (typeof p.error === 'string' && p.error.trim().length) return p.error;
  if (typeof p.message === 'string' && p.message.trim().length) return p.message;
  return null;
}

export function apiGetUserLists(getToken: GetToken) {
  return apiFetchJson<{ lists: ApiListRow[] }>(getToken, '/api/lists');
}

export function apiGetListById(getToken: GetToken, id: number) {
  return apiFetchJson<{ list: ApiList }>(getToken, `/api/lists/${id}`);
}

export function apiGetListItems(getToken: GetToken, listId: number) {
  return apiFetchJson<{ items: ApiItem[] }>(getToken, `/api/items/list/${listId}`);
}

export function apiGetItemById(getToken: GetToken, id: number) {
  return apiFetchJson<{ item: ApiItem }>(getToken, `/api/items/${id}`);
}

export function apiAddItem(getToken: GetToken, body: { listId: number; url: string }) {
  return apiFetchJson<{ item: ApiItem }>(getToken, '/api/items', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
