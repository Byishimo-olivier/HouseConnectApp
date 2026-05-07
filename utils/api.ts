import { API_BASE_URL, BACKEND_URL } from '../constants/config';
export { BACKEND_URL };
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('userToken');
    const isAuthRoute = endpoint.includes('/auth/');

    // Early exit if no token and not an auth route to prevent noisy log errors during logout
    if (!token && !isAuthRoute) {
        return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutMs = 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`REQUEST_TIMEOUT (${timeoutMs}ms). Check API host: ${API_BASE_URL}`);
        }
        throw new Error(`NETWORK_ERROR. Check API host: ${API_BASE_URL}`);
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage = (errorData?.message || '').toString();
        const normalizedMessage = rawMessage.toLowerCase();
        const isTokenErrorMessage =
            normalizedMessage.includes('invalid or expired token') ||
            normalizedMessage.includes('access token required') ||
            normalizedMessage.includes('jwt expired');

        // Standardize expired/invalid session errors for non-auth endpoints.
        if (!isAuthRoute && (response.status === 401 || isTokenErrorMessage)) {
            throw new Error('AUTHENTICATION_REQUIRED');
        }

        const message = errorData?.debug
            ? `${errorData.message || 'Something went wrong'}: ${errorData.debug}`
            : (errorData?.message || 'Something went wrong');
        throw new Error(message);
    }

    return response.json();
}
