import Constants from 'expo-constants';

/** Resolves the API base URL from env / app.json extra, with a dev fallback. */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:4000/api';

export const REQUEST_TIMEOUT_MS = 15000;
