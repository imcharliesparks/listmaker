type ShareIntentLike = {
  webUrl?: string | null;
  text?: string | null;
};

export function getBestSharedUrl(shareIntent: ShareIntentLike | null | undefined): string | null {
  if (!shareIntent) return null;
  const direct = (shareIntent.webUrl ?? '').trim();
  if (direct.length) return direct;
  const text = (shareIntent.text ?? '').trim();
  if (!text.length) return null;
  return extractFirstHttpUrl(text);
}

export function extractFirstHttpUrl(text: string): string | null {
  // Basic heuristic: grab the first http(s) URL-like token.
  const match = text.match(/https?:\/\/[^\s<>()]+/i);
  return match?.[0] ?? null;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

