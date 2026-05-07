import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChartDatum, PaymentTrendDatum } from './types';

type Props = {
  trendData: PaymentTrendDatum[];
  statusData: ChartDatum[];
  isDark?: boolean;
};

function MiniBars({ title, rows }: { title: string; rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row) => {
        const widthPct = Math.max(8, Math.round((row.value / max) * 100));
        return (
          <View key={`${title}-${row.label}`} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: row.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminPaymentsCharts({ trendData, statusData }: Props) {
  const volumeRows = trendData.map((item) => ({ label: item.label, value: item.volume, color: '#1D4ED8' }));
  const countRows = trendData.map((item) => ({ label: item.label, value: item.transactions, color: '#0EA5E9' }));

  return (
    <View style={styles.grid}>
      <MiniBars title="Payments Overview" rows={volumeRows} />
      <MiniBars title="Transactions Trend" rows={countRows} />
      <MiniBars title="Payment Status" rows={statusData} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    minWidth: 260,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14
  },
  title: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  row: { marginBottom: 8 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 11, color: '#475569', fontWeight: '600' },
  value: { fontSize: 11, color: '#0F172A', fontWeight: '800' },
  track: { height: 8, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 }
});
