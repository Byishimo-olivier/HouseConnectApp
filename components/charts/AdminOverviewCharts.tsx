import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChartDatum } from './types';

type Props = {
  roles: ChartDatum[];
  jobs: ChartDatum[];
  payments: ChartDatum[];
  applications: ChartDatum[];
  isDark?: boolean;
};

function ProgressCard({ title, items }: { title: string; items: ChartDatum[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.map((item) => {
        const widthPct = Math.max(6, Math.round((item.value / max) * 100));
        return (
          <View key={`${title}-${item.label}`} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminOverviewCharts({ roles, jobs, payments, applications }: Props) {
  return (
    <View style={styles.grid}>
      <ProgressCard title="User Roles" items={roles} />
      <ProgressCard title="Jobs Pipeline" items={jobs} />
      <ProgressCard title="Payments Status" items={payments} />
      <ProgressCard title="Applications Funnel" items={applications} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    minWidth: 260,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 13
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  row: { marginBottom: 8 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowLabel: { fontSize: 11, color: '#475569', fontWeight: '600' },
  rowValue: { fontSize: 11, color: '#0F172A', fontWeight: '800' },
  track: { height: 8, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 }
});
