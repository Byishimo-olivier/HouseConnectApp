import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="role-selection" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="verify-reset-code" />
            <Stack.Screen name="new-password" />
            <Stack.Screen name="forgot" />
        </Stack>
    );
}
