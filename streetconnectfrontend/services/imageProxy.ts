import Constants from 'expo-constants';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3000/api/v1';

/**
 * Convert a Supabase storage URL to a backend-proxied URL.
 * The backend has DNS fixed (google/cloudflare), so images load even when
 * the ISP hijacks Supabase DNS on the device.
 */
export function proxyImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Local file:// or data: URIs are already device-local — no proxy needed
  if (url.startsWith('file://') || url.startsWith('data:')) return url;
  // Already a proxied URL — don't double-proxy
  if (url.includes('/upload/proxy')) return url;
  // Any Supabase storage URL goes through our backend proxy
  if (url.includes('supabase.co')) {
    return `${BASE_URL}/upload/proxy?u=${encodeURIComponent(url)}`;
  }
  return url;
}
