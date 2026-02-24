import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../utils/api';
import { getOrCreateKeyPair } from '../utils/crypto';

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
    profile: ProfileData | null;
    unreadCount: number;
    unreadChatCount: number;
    refreshProfile: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
    refreshUnreadChatCount: () => Promise<void>;
    updateLocalProfile: (data: Partial<ProfileData>) => void;
    logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
    profile: null,
    unreadCount: 0,
    unreadChatCount: 0,
    refreshProfile: async () => { },
    refreshUnreadCount: async () => { },
    refreshUnreadChatCount: async () => { },
    updateLocalProfile: () => { },
    logout: async () => { },
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isRegisteringKey, setIsRegisteringKey] = useState(false);

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

    const refreshProfile = useCallback(async () => {
        try {
            const data = await apiFetch('/profile/me');
            const userId = data.id;

            // Load the locally-stored image URI (scoped to user)
            const localImage = userId ? await AsyncStorage.getItem(GET_LOCAL_IMAGE_KEY(userId)) : null;

            const profileData = {
                ...data,
                profileImage: localImage || data.profileImage || null,
            };

            setProfile(profileData);

            // E2EE Key Registration
            if (userId && !isRegisteringKey) {
                const keys = await getOrCreateKeyPair();
                // Enhanced logging to see the actual keys
                console.log(`[E2EE Sync] Me: ${userId} | Server Key: ${data.publicKey?.substring(0, 10)}... | Local Key: ${keys.publicKey.substring(0, 10)}...`);

                if (data.publicKey !== keys.publicKey) {
                    setIsRegisteringKey(true);
                    console.log('Registering new public key for E2EE...');
                    await apiFetch('/chat/public-key', {
                        method: 'POST',
                        body: JSON.stringify({ publicKey: keys.publicKey })
                    }).then(() => {
                        console.log('[E2EE Sync] Registration Successful. Updating local Profile state.');
                        setProfile(prev => prev ? { ...prev, publicKey: keys.publicKey } : null);
                    }).catch(err => {
                        console.error('[E2EE Sync] Registration Failed:', err);
                    }).finally(() => setIsRegisteringKey(false));
                } else {
                    console.log('[E2EE Sync] Keys are in sync.');
                }
            }

            // Also refresh unread counts on profile refresh
            refreshUnreadCount();
            refreshUnreadChatCount();
        } catch (error) {
            console.error('Refresh Profile Error:', error);
        }
    }, [refreshUnreadCount, refreshUnreadChatCount]);

    const updateLocalProfile = useCallback(async (data: Partial<ProfileData>) => {
        const userId = profile?.id;

        // If a new profileImage (local URI) is provided, persist it to AsyncStorage
        if (data.profileImage !== undefined && userId) {
            const key = GET_LOCAL_IMAGE_KEY(userId);
            if (data.profileImage) {
                await AsyncStorage.setItem(key, data.profileImage);
            } else {
                await AsyncStorage.removeItem(key);
            }
        }
        setProfile(prev => prev ? { ...prev, ...data } : null);
    }, [profile?.id]);

    const logout = useCallback(async () => {
        const userId = profile?.id;
        const keys = ['userToken', 'userInfo'];
        if (userId) keys.push(GET_LOCAL_IMAGE_KEY(userId));

        await AsyncStorage.multiRemove(keys);
        setProfile(null);
    }, [profile?.id]);

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, unreadCount, unreadChatCount, refreshProfile, refreshUnreadCount, refreshUnreadChatCount, updateLocalProfile, logout }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    return useContext(ProfileContext);
}
