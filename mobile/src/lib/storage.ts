/**
 * Secure token storage. Uses expo-secure-store (Keychain/Keystore) on native;
 * falls back to in-memory on web where SecureStore is unavailable.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS = 'aggrimart.accessToken';
const REFRESH = 'aggrimart.refreshToken';

const memory = new Map<string, string>();
const webFallback = Platform.OS === 'web';

async function setItem(key: string, value: string) {
  if (webFallback) return void memory.set(key, value);
  await SecureStore.setItemAsync(key, value);
}
async function getItem(key: string): Promise<string | null> {
  if (webFallback) return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function deleteItem(key: string) {
  if (webFallback) return void memory.delete(key);
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async save(accessToken: string, refreshToken: string) {
    await Promise.all([setItem(ACCESS, accessToken), setItem(REFRESH, refreshToken)]);
  },
  getAccess: () => getItem(ACCESS),
  getRefresh: () => getItem(REFRESH),
  async clear() {
    await Promise.all([deleteItem(ACCESS), deleteItem(REFRESH)]);
  },
};
