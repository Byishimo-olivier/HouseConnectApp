import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProfile } from '@/context/ProfileContext';

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { profile } = useProfile();
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

export default function EmployeeLayout() {
  const { unreadCount, unreadChatCount } = useProfile();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
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
              onPress={() => router.push('/employee/messages')}
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
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.fill" color={color} />,
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payment',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="creditcard.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
          }}
        />

        {/* Hiding these from the Tab Bar */}
        <Tabs.Screen name="find-maids" options={{ href: null }} />
        <Tabs.Screen name="maid-profile/[id]" options={{ href: null }} />
        <Tabs.Screen name="post-job" options={{ href: null }} />
        <Tabs.Screen name="messages" options={{ href: null, headerRight: () => null }} />
        <Tabs.Screen name="disputes" options={{ href: null, title: 'My Disputes' }} />
      </Tabs>

      {/* Floating Action Button - Post Job */}
      {/* <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
        onPress={() => router.push('/employee/post-job')}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 100,
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
