import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AdminSidebarItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
};

type Props = {
  brand: string;
  subtitle: string;
  items: AdminSidebarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onLogout: () => void;
};

export default function AdminSidebar({ brand, subtitle, items, activeKey, onSelect, onLogout }: Props) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.brand}>{brand}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.navCol}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={[styles.navButton, active && styles.navButtonActive]}
              activeOpacity={0.9}
            >
              <Ionicons name={item.icon} size={16} color={active ? '#FFFFFF' : '#102A43'} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {!!item.badge && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={16} color="#DCEBFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 292,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#0B2742',
    borderColor: '#17456D'
  },
  brand: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { marginTop: 4, fontSize: 12, color: '#C7DDF9' },
  navCol: { marginTop: 18, gap: 8, flex: 1 },
  navButton: {
    borderWidth: 1,
    borderColor: '#9CC5EE',
    backgroundColor: '#E5F1FF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  navButtonActive: {
    borderColor: '#1D65A3',
    backgroundColor: '#1D65A3'
  },
  navLabel: { fontSize: 13, fontWeight: '700', color: '#102A43', flex: 1 },
  navLabelActive: { color: '#FFFFFF' },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#D9E9FA'
  },
  badgeActive: {
    backgroundColor: '#0B2742'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D65A3'
  },
  badgeTextActive: {
    color: '#DCEBFF'
  },
  logout: {
    borderTopWidth: 1,
    borderTopColor: '#2D5C87',
    paddingTop: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#DCEBFF' }
});

