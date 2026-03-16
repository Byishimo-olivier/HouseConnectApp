import Constants from 'expo-constants';
import { Platform } from 'react-native';

const WEB_HOST = 'localhost';

function extractHostname(input?: string) {
  if (!input) return undefined;
  const withoutProtocol = input.replace(/^[a-zA-Z]+:\/\//, '');
  const beforePath = withoutProtocol.split('/')[0] ?? '';
  const host = beforePath.split(':')[0] ?? '';
  return host || undefined;
}

function inferDevHostFromExpo() {
  const anyConstants = Constants as any;
  const candidates = [
    anyConstants?.expoConfig?.hostUri,
    anyConstants?.expoGoConfig?.debuggerHost,
    anyConstants?.manifest2?.extra?.expoClient?.hostUri,
    anyConstants?.manifest?.debuggerHost,
  ];

  for (const candidate of candidates) {
    const host = extractHostname(candidate);
    if (host && host !== 'localhost') return host;
  }
  return undefined;
}

function resolveHost() {
  if (Platform.OS === 'web') return WEB_HOST;

  // Preferred overrides (set these in your environment/.env as needed)
  const envHost = process.env.EXPO_PUBLIC_API_HOST || process.env.EXPO_PUBLIC_DEV_IP;
  if (envHost) return envHost;

  // Dev: infer host from Expo packager/debugger (usually your PC's LAN IP)
  const expoHost = inferDevHostFromExpo();
  if (expoHost) return expoHost;

  // Emulator/simulator defaults
  if (!Constants.isDevice) {
    // Android emulator cannot reach your PC via localhost
    if (Platform.OS === 'android') return '10.0.2.2';
    return WEB_HOST; // iOS simulator
  }

  // Physical device fallback (update to your PC's LAN IP if you don't set env vars)
  return '192.168.1.64';
}

const HOST = resolveHost();

const computedApiBaseUrl = `http://${HOST}:8000/api`;
const computedBackendUrl = `http://${HOST}:8000`;

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

export const API_BASE_URL =
  Platform.OS !== 'web' && envApiBaseUrl?.includes('localhost') ? computedApiBaseUrl : envApiBaseUrl || computedApiBaseUrl;

export const BACKEND_URL =
  Platform.OS !== 'web' && envBackendUrl?.includes('localhost') ? computedBackendUrl : envBackendUrl || computedBackendUrl;

