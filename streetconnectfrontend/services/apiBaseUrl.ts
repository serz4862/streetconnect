/**
 * Resolves the backend REST API base URL.
 *
 * Priority (first non-empty wins):
 *  1. EXPO_PUBLIC_API_URL  – explicit value set in .env  ← always wins in dev
 *  2. Auto-detect from Expo Metro host (LAN/loopback only, not tunnel)
 *  3. Android emulator default  (10.0.2.2)
 *  4. iOS simulator / web default  (127.0.0.1)
 *
 * The .env file is the only thing you need to change when your Wi-Fi IP changes.
 * Run:  echo "EXPO_PUBLIC_API_URL=http://$(ipconfig getifaddr en0):3000/api/v1" > streetconnectfrontend/.env
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PATH = '/api/v1';
const DEV_PORT = process.env.EXPO_PUBLIC_API_DEV_PORT || '3000';

function isLanHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
  if (/^192\.168\.\d+\.\d+$/.test(h)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h)) return true;
  return false;
}

function autoDetectHost(): string | null {
  const uri = Constants.expoConfig?.hostUri;
  if (!uri) return null;
  const host = uri.split(':')[0]?.trim();
  if (!host || !isLanHost(host)) return null;
  return host;
}

export function getApiBaseUrl(): string {
  // 1. Explicit .env value always wins
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // 2. In dev, auto-resolve from Metro's hostUri so it works without .env changes
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const host = autoDetectHost();

    if (Platform.OS === 'android') {
      // Physical Android device: Metro host is the LAN IP – use it directly
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:${DEV_PORT}${API_PATH}`;
      }
      // Android emulator: cannot reach host via 127.0.0.1, use special alias
      return `http://10.0.2.2:${DEV_PORT}${API_PATH}`;
    }

    // iOS physical device OR web: Metro host is the LAN IP – use it
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${DEV_PORT}${API_PATH}`;
    }

    // iOS simulator / web localhost fallback
    return `http://127.0.0.1:${DEV_PORT}${API_PATH}`;
  }

  // 3. Production: use app.json extra.apiUrl
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  return fromExtra || `http://127.0.0.1:${DEV_PORT}${API_PATH}`;
}
