import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';

type Section = 'overview' | 'users' | 'jobs' | 'applications' | 'contracts' | 'payments' | 'disputes' | 'reviews';
type ModalType = 'create' | 'edit' | 'delete' | null;
type ListRes<T> = { items: T[]; pagination: { total: number; page: number; limit: number; totalPages: number } };

const NAV = [
  { key: 'overview' as const, label: 'Overview', icon: 'grid-outline' as const },
  { key: 'users' as const, label: 'Users', icon: 'people-outline' as const },
  { key: 'jobs' as const, label: 'Jobs', icon: 'briefcase-outline' as const },
  { key: 'contracts' as const, label: 'Contracts', icon: 'document-text-outline' as const },
  { key: 'disputes' as const, label: 'Disputes', icon: 'warning-outline' as const },
];

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const money = (amount: unknown, currency: unknown) =>
  `${Number(amount || 0).toLocaleString()} ${String(currency || 'RWF').toUpperCase()}`;

export default function AdminDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const { profile, logout } = useProfile();
  const desktop = width >= 1100;

  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Data state
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<any>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, u, j, c, d] = await Promise.all([
        apiFetch('/admin/overview'),
        apiFetch('/admin/users?limit=100'),
        apiFetch('/admin/jobs?limit=100'),
        apiFetch('/admin/contracts?limit=100'),
        apiFetch('/admin/disputes?limit=100')
      ]) as [any, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>];

      setOverview(o);
      setUsers(u.items || []);
      setJobs(j.items || []);
      setContracts(c.items || []);
      setDisputes(d.items || []);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile || profile.role !== 'ADMIN') return;
    loadAll();
  }, [profile, loadAll]);

  const filteredData = useMemo(() => {
    const q = (v: unknown) => String(v || '').toLowerCase();
    const query = q(search.trim());

    let data = [];
    switch (section) {
      case 'users':
        data = users;
        break;
      case 'jobs':
        data = jobs;
        break;
      case 'contracts':
        data = contracts;
        break;
      case 'disputes':
        data = disputes;
        break;
      default:
        return [];
    }

    if (!query) return data;
    return data.filter(item => q(JSON.stringify(item)).includes(query));
  }, [section, search, users, jobs, contracts, disputes]);

  const openCreateModal = useCallback(() => {
    setFormData({});
    setSelectedItem(null);
    setModalType('create');
  }, []);

  const openEditModal = useCallback((item: any) => {
    setFormData({ ...item });
    setSelectedItem(item);
    setModalType('edit');
  }, []);

  const openDeleteModal = useCallback((item: any) => {
    setSelectedItem(item);
    setModalType('delete');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!formData || !selectedItem) return;

    setActing(true);
    try {
      let endpoint = '';
      switch (section) {
        case 'users':
          endpoint = '/admin/users';
          break;
        case 'jobs':
          endpoint = '/admin/jobs';
          break;
        case 'contracts':
          endpoint = '/admin/contracts';
          break;
        default:
          return;
      }

      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      Alert.alert('Success', `${section.slice(0, -1)} created successfully`);
      setModalType(null);
      await loadAll();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create item');
    } finally {
      setActing(false);
    }
  }, [formData, selectedItem, section, loadAll]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;

    setActing(true);
    try {
      let endpoint = '';
      const id = selectedItem.id;

      switch (section) {
        case 'users':
          endpoint = `/admin/users/${id}`;
          break;
        case 'jobs':
          endpoint = `/admin/jobs/${id}`;
          break;
        case 'contracts':
          endpoint = `/admin/contracts/${id}`;
          break;
        case 'disputes':
          endpoint = `/admin/disputes/${id}`;
          break;
        default:
          return;
      }

      await apiFetch(endpoint, { method: 'DELETE' });

      Alert.alert('Success', `${section.slice(0, -1)} deleted successfully`);
      setModalType(null);
      await loadAll();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete item');
    } finally {
      setActing(false);
    }
  }, [selectedItem, section, loadAll]);

  const handleStatusChange = useCallback(async (item: any, newStatus: string) => {
    setActing(true);
    try {
      let endpoint = '';
      const id = item.id;

      switch (section) {
        case 'jobs':
          endpoint = `/admin/jobs/${id}/status`;
          break;
        case 'contracts':
          endpoint = `/admin/contracts/${id}/status`;
          break;
        case 'disputes':
          endpoint = `/admin/disputes/${id}/status`;
          break;
        default:
          return;
      }

      await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      await loadAll();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update status');
    } finally {
      setActing(false);
    }
  }, [section, loadAll]);

  if (!profile || profile.role !== 'ADMIN') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Admin Access Required</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const stats = overview?.stats || {};

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Admin Dashboard</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage all platform features</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.primary }]}
          onPress={async () => {
            await logout();
            router.replace('/auth/login');
          }}
        >
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nav}
        style={[{ backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        {NAV.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              section === item.key && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSection(item.key)}
          >
            <Text
              style={[
                styles.navText,
                section === item.key ? { color: '#fff' } : { color: theme.text }
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        {section === 'overview' ? (
          <View style={styles.overviewGrid}>
            <StatCard label="Total Users" value={stats.usersCount || 0} color={theme.primary} />
            <StatCard label="Jobs" value={stats.jobsCount || 0} color="#10B981" />
            <StatCard label="Contracts" value={stats.contractsCount || 0} color="#F59E0B" />
            <StatCard label="Disputes" value={stats.disputesCount || 0} color="#EF4444" />
            <StatCard label="Payment Volume" value={`${(stats.paymentVolume || 0).toLocaleString()} RWF`} color="#8B5CF6" />
            <StatCard label="Payment Success Rate" value={`${Math.round((stats.successfulPaymentsCount || 0) / Math.max(stats.paymentsCount || 1, 1) * 100)}%`} color="#06B6D4" />
          </View>
        ) : (
          <View>
            {/* Search and Actions */}
            <View style={[styles.toolbar, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.search, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={`Search ${section}...`}
                  placeholderTextColor={theme.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {(section === 'users' || section === 'jobs' || section === 'contracts') && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: theme.primary }]}
                  onPress={openCreateModal}
                  disabled={acting}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.btnText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Table */}
            <View style={[styles.tableCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {filteredData.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No {section} found</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredData.map((item, index) => (
                    <View key={item.id} style={styles.tableRow}>
                      <View style={styles.rowContent}>
                        {section === 'users' && (
                          <>
                            <Text style={[styles.rowTitle, { color: theme.text }]}>
                              {item.fullName || 'N/A'}
                            </Text>
                            <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                              {item.email} • {item.role}
                            </Text>
                          </>
                        )}
                        {section === 'jobs' && (
                          <>
                            <Text style={[styles.rowTitle, { color: theme.text }]}>
                              {item.title}
                            </Text>
                            <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                              {item.location} • {money(item.salary, item.currency)}
                            </Text>
                            <StatusBadge status={item.status} />
                          </>
                        )}
                        {section === 'contracts' && (
                          <>
                            <Text style={[styles.rowTitle, { color: theme.text }]}>
                              {item.title}
                            </Text>
                            <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                              {item?.employer?.fullName} → {item?.maid?.fullName}
                            </Text>
                            <StatusBadge status={item.status} />
                          </>
                        )}
                        {section === 'disputes' && (
                          <>
                            <Text style={[styles.rowTitle, { color: theme.text }]}>
                              {item.reason}
                            </Text>
                            <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                              {item?.contract?.title}
                            </Text>
                            <StatusBadge status={item.status} />
                          </>
                        )}
                      </View>

                      {/* Actions */}
                      <View style={styles.rowActions}>
                        {(section === 'jobs' || section === 'contracts' || section === 'disputes') && (
                          <View style={styles.statusButtons}>
                            {section === 'jobs' &&
                              ['OPEN', 'FILLED', 'CLOSED'].map(status => (
                                <TouchableOpacity
                                  key={status}
                                  style={[
                                    styles.statusBtn,
                                    item.status === status && styles.statusBtnActive
                                  ]}
                                  onPress={() => handleStatusChange(item, status)}
                                  disabled={acting}
                                >
                                  <Text
                                    style={[
                                      styles.statusBtnText,
                                      item.status === status && styles.statusBtnTextActive
                                    ]}
                                  >
                                    {status.slice(0, 1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            {section === 'contracts' &&
                              ['ACTIVE', 'COMPLETED', 'TERMINATED'].map(status => (
                                <TouchableOpacity
                                  key={status}
                                  style={[
                                    styles.statusBtn,
                                    item.status === status && styles.statusBtnActive
                                  ]}
                                  onPress={() => handleStatusChange(item, status)}
                                  disabled={acting}
                                >
                                  <Text
                                    style={[
                                      styles.statusBtnText,
                                      item.status === status && styles.statusBtnTextActive
                                    ]}
                                  >
                                    {status.slice(0, 1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            {section === 'disputes' &&
                              ['OPEN', 'RESOLVED', 'CLOSED'].map(status => (
                                <TouchableOpacity
                                  key={status}
                                  style={[
                                    styles.statusBtn,
                                    item.status === status && styles.statusBtnActive
                                  ]}
                                  onPress={() => handleStatusChange(item, status)}
                                  disabled={acting}
                                >
                                  <Text
                                    style={[
                                      styles.statusBtnText,
                                      item.status === status && styles.statusBtnTextActive
                                    ]}
                                  >
                                    {status.slice(0, 1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]}
                          onPress={() => openDeleteModal(item)}
                          disabled={acting}
                        >
                          <Ionicons name="trash" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={modalType === 'create' || modalType === 'edit'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {modalType === 'create' ? `Add ${section.slice(0, -1)}` : `Edit ${section.slice(0, -1)}`}
            </Text>

            {section === 'users' && (
              <>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.fullName || ''}
                  onChangeText={v => setFormData({ ...formData, fullName: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.email || ''}
                  onChangeText={v => setFormData({ ...formData, email: v })}
                />
                {modalType === 'create' && (
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    value={formData.password || ''}
                    onChangeText={v => setFormData({ ...formData, password: v })}
                  />
                )}
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Phone"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.phone || ''}
                  onChangeText={v => setFormData({ ...formData, phone: v })}
                />
              </>
            )}

            {section === 'jobs' && (
              <>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Job Title"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.title || ''}
                  onChangeText={v => setFormData({ ...formData, title: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Location"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.location || ''}
                  onChangeText={v => setFormData({ ...formData, location: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Employer ID"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.employerId || '')}
                  onChangeText={v => setFormData({ ...formData, employerId: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Min Salary (optional)"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.salaryMin || '')}
                  onChangeText={v => setFormData({ ...formData, salaryMin: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Max Salary (optional)"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.salaryMax || '')}
                  onChangeText={v => setFormData({ ...formData, salaryMax: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.description || ''}
                  onChangeText={v => setFormData({ ...formData, description: v })}
                  multiline
                />
              </>
            )}

            {section === 'contracts' && (
              <>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Contract Title"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.title || ''}
                  onChangeText={v => setFormData({ ...formData, title: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Employer ID"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.employerId || '')}
                  onChangeText={v => setFormData({ ...formData, employerId: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Maid ID"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.maidId || '')}
                  onChangeText={v => setFormData({ ...formData, maidId: v })}
                />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Salary"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(formData.salary || '')}
                  onChangeText={v => setFormData({ ...formData, salary: v })}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => setModalType(null)}
                disabled={acting}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.primary }]}
                onPress={handleCreate}
                disabled={acting}
              >
                {acting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>{modalType === 'create' ? 'Create' : 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={modalType === 'delete'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Item?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This action cannot be undone. Are you sure?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => setModalType(null)}
                disabled={acting}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#DC2626' }]}
                onPress={handleDelete}
                disabled={acting}
              >
                {acting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: any) {
  let bgColor = '#F3F4F6';
  let textColor = '#374151';

  if (status === 'OPEN' || status === 'ACTIVE') {
    bgColor = '#DCFCE7';
    textColor = '#166534';
  } else if (status === 'PENDING' || status === 'INTERVIEW') {
    bgColor = '#FEF3C7';
    textColor = '#92400E';
  } else if (status === 'CLOSED' || status === 'TERMINATED' || status === 'REJECTED') {
    bgColor = '#FEE2E2';
    textColor = '#991B1B';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },

  nav: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  navText: { fontSize: 13, fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '30%',
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },

  toolbar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 8 },

  tableCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rowSub: { fontSize: 12, marginBottom: 6 },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  statusBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  statusBtnText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  statusBtnTextActive: { color: '#FFFFFF' },

  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },

  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalText: { fontSize: 13, marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 13,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
