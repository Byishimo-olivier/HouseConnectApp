import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProfileProvider } from '@/context/ProfileContext';

export const unstable_settings = {
  anchor: 'index',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="employee" options={{ headerShown: false }} />
        <Stack.Screen name="maid" options={{ headerShown: false }} />
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
