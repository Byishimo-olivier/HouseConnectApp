import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/context/ProfileContext';

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const profileContext = useProfile();
  const profile = profileContext?.profile;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (profile?.profileImage) {
    return (
      <Image
        source={{ uri: profile.profileImage }}
        style={[
          styles.tabAvatar,
          focused && { borderColor: theme.primary, borderWidth: 2 }
        ]}
      />
    );
  }

  if (profile?.fullName) {
    return (
      <View style={[
        styles.tabInitials,
        { backgroundColor: focused ? theme.primary : theme.tabIconDefault + '30' }
      ]}>
        <Text style={[styles.tabInitialsText, { color: focused ? '#fff' : theme.tabIconDefault }]}>
          {getInitials(profile.fullName)}
        </Text>
      </View>
    );
  }

  return <IconSymbol size={24} name="person.crop.circle" color={color} />;
}

export default function MaidLayout() {
  const { unreadCount, unreadChatCount } = useProfile();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.text,
          fontSize: 20,
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/maid/messages')}
            style={{ marginRight: Spacing.md }}
          >
            <View>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.text} />
              {unreadChatCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadChatCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'My Applications',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="briefcase.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Find Jobs',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar" color={color} />
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.fill" color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
        }}
      />

      {/* Hidden from Tab Bar */}
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null, headerRight: () => null }} />
      <Tabs.Screen name="disputes" options={{ href: null, title: 'My Disputes' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  tabInitials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInitialsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
