import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'share_lastListId';

export async function readLastSharedListId(): Promise<number | null> {
  if (Platform.OS === 'web') {
    try {
      const raw = globalThis?.localStorage?.getItem(KEY) ?? null;
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeLastSharedListId(listId: number): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis?.localStorage?.setItem(KEY, String(listId));
    } catch {
      // ignore
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(KEY, String(listId));
  } catch {
    // ignore
  }
}
