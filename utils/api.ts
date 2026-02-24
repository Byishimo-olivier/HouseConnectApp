import { API_BASE_URL, BACKEND_URL } from '../constants/config';
export { BACKEND_URL };
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Something went wrong');
    }

    return response.json();
}
