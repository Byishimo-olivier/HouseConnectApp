import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../utils/api';
import { getOrCreateKeyPair } from '../utils/crypto';
import { sanitizeProfileImage } from '../utils/image';

// Local storage keys
const GET_LOCAL_IMAGE_KEY = (userId: string | number) => `localProfileImage_${userId}`;

interface ProfileData {
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
    role: string;
    // Allow any additional fields from the API
    [key: string]: any;
}

interface ProfileContextType {
    isLoading: boolean;
    profile: ProfileData | null;
    unreadCount: number;
    unreadChatCount: number;
    refreshProfile: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
    refreshUnreadChatCount: () => Promise<void>;
    updateLocalProfile: (data: Partial<ProfileData>) => Promise<void>;
    logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
    isLoading: true,
    profile: null,
    unreadCount: 0,
    unreadChatCount: 0,
    refreshProfile: async () => { },
    refreshUnreadCount: async () => { },
    refreshUnreadChatCount: async () => { },
    updateLocalProfile: async () => { },
    logout: async () => { },
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const isRegisteringKey = React.useRef(false);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const data = await apiFetch('/notifications/unread-count');
            setUnreadCount(data.count || 0);
        } catch {
            // Not logged in or error
        }
    }, []);

    const refreshUnreadChatCount = useCallback(async () => {
        try {
            const data = await apiFetch('/chat/unread-count');
            setUnreadChatCount(data.count || 0);
        } catch {
            // Not logged in or error
        }
    }, []);

    const logout = useCallback(async () => {
        const userId = profile?.id;
        const keys = ['userToken', 'userInfo', 'userRole'];
        if (userId) keys.push(GET_LOCAL_IMAGE_KEY(userId));

        console.log('Logging out, clearing keys:', keys);
        await AsyncStorage.multiRemove(keys);
        setProfile(null);
    }, [profile?.id]);

    const refreshProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setProfile(null);
                return;
            }

            const data = await apiFetch('/profile/me');
            const userId = data.id;

            // Load the locally-stored image URI (scoped to user)
            const localImage = userId ? await AsyncStorage.getItem(GET_LOCAL_IMAGE_KEY(userId)) : null;

            const profileData = {
                ...data,
                profileImage: sanitizeProfileImage(localImage || data.profileImage || null),
            };

            setProfile(profileData);

            // E2EE Key Registration
            if (userId && !isRegisteringKey.current) {
                const keys = await getOrCreateKeyPair();

                // Only register if server doesn't have our key OR it's different
                if (data.publicKey !== keys.publicKey) {
                    isRegisteringKey.current = true;
                    console.log('Registering new public key for E2EE...');
                    try {
                        await apiFetch('/chat/public-key', {
                            method: 'POST',
                            body: JSON.stringify({ publicKey: keys.publicKey })
                        });
                        console.log('[E2EE Sync] Registration Successful.');
                        // Update local state ONLY - don't trigger refreshProfile again to avoid loops
                        setProfile(prev => prev ? { ...prev, publicKey: keys.publicKey } : null);
                    } catch (err) {
                        console.error('[E2EE Sync] Registration Failed:', err);
                    } finally {
                        isRegisteringKey.current = false;
                    }
                } else {
                    console.log('[E2EE Sync] Keys are in sync.');
                }
            }

            // Also refresh unread counts on profile refresh
            refreshUnreadCount();
            refreshUnreadChatCount();
        } catch (error: any) {
            console.error('Refresh Profile Error:', error);
            if (error?.message === 'Invalid or expired token' || error?.message === 'Access token required') {
                console.log('Session invalid. Logging out...');
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    }, [refreshUnreadCount, refreshUnreadChatCount, logout]);

    const updateLocalProfile = useCallback(async (data: Partial<ProfileData>) => {
        const userId = profile?.id;

        // Sanitize the incoming profileImage data
        const profileImage = data.profileImage !== undefined ? sanitizeProfileImage(data.profileImage) : undefined;

        // If a new profileImage (local URI) is provided, persist it to AsyncStorage
        if (profileImage !== undefined && userId) {
            const key = GET_LOCAL_IMAGE_KEY(userId);
            if (profileImage) {
                await AsyncStorage.setItem(key, profileImage);
            } else {
                await AsyncStorage.removeItem(key);
            }
        }

        setProfile(prev => {
            if (!prev) return null;
            const { profileImage: _unused, ...rest } = data;
            const updated = { ...prev, ...rest } as ProfileData;
            if (profileImage !== undefined) {
                updated.profileImage = profileImage;
            }
            return updated;
        });
    }, [profile?.id]);

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <ProfileContext.Provider value={{ isLoading, profile, unreadCount, unreadChatCount, refreshProfile, refreshUnreadCount, refreshUnreadChatCount, updateLocalProfile, logout }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    return useContext(ProfileContext);
}
