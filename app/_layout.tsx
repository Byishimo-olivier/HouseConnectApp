import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';

export const unstable_settings = {
  anchor: 'index',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { profile, isLoading } = useProfile();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!profile && !inAuthGroup) {
      // User is not logged in and not in auth group, redirect to welcome
      router.replace('/auth/welcome');
    } else if (profile && inAuthGroup) {
      // User is logged in and in auth group, redirect to their respective dashboard
      if (profile.role === 'MAID') {
        router.replace('/maid');
      } else if (profile.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/employee');
      }
    } else if (profile && !inAuthGroup) {
      if (profile.role === 'ADMIN' && segments[0] !== 'admin') {
        router.replace('/admin');
      } else if (profile.role === 'MAID' && segments[0] === 'employee') {
        router.replace('/maid');
      } else if (profile.role === 'EMPLOYER' && segments[0] === 'maid') {
        router.replace('/employee');
      }
    }
  }, [profile, isLoading, segments, router]);

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="employee" options={{ headerShown: false }} />
        <Stack.Screen name="maid" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
        <Stack.Screen name="message" options={{ title: 'Message' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="jobs/list" options={{ title: 'My Jobs', headerBackTitle: 'Back' }} />
        <Stack.Screen name="jobs/[id]" options={{ title: 'Job Details', headerBackTitle: 'Jobs' }} />
        <Stack.Screen name="applications/list" options={{ title: 'Applications', headerBackTitle: 'Back' }} />
        <Stack.Screen name="applications/[id]" options={{ title: 'Applicant', headerBackTitle: 'Apps' }} />
        <Stack.Screen name="features/file-dispute" options={{ title: 'File Dispute', presentation: 'modal' }} />
        <Stack.Screen name="features/leave-review" options={{ title: 'Leave Review', presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider >
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <RootLayoutNav />
      </ProfileProvider>
    </ThemeProvider>
  );
}
