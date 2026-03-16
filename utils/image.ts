import { Platform } from 'react-native';

/**
 * Sanitizes an image URL to prevent crashes on native platforms.
 * Specifically filters out 'blob:' URLs which cause "No suitable URL request handler found"
 * on iOS and Android.
 */
export const sanitizeProfileImage = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (Platform.OS !== 'web' && url.toString().startsWith('blob:')) {
        console.warn('Blocked invalid blob URL on native platform');
        return null;
    }
    return url;
};
