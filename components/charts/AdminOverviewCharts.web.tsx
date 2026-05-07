import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts/umd/Recharts.js';
import type { ChartDatum } from './types';

type Props = {
  roles: ChartDatum[];
  jobs: ChartDatum[];
  payments: ChartDatum[];
  applications: ChartDatum[];
  isDark: boolean;
};

function PieCard({ title, items, isDark }: { title: string; items: ChartDatum[]; isDark: boolean }) {
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#D8E4F8';
  const textColor = isDark ? '#E2E8F0' : '#334155';

  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>
      <PieChart style={styles.chart} responsive data={items}>
        <Pie data={items} dataKey="value" nameKey="label" innerRadius="44%" outerRadius="76%" paddingAngle={2}>
          {items.map((item) => (
            <Cell key={`${title}-${item.label}`} fill={item.color} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span style={{ color: textColor }}>{String(value)}</span>}
        />
        <Tooltip
          formatter={(value) => Number(value).toLocaleString()}
          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
          labelStyle={{ color: textColor }}
        />
      </PieChart>
    </div>
  );
}

function BarCard({ title, items, isDark }: { title: string; items: ChartDatum[]; isDark: boolean }) {
  const axisColor = isDark ? '#CBD5E1' : '#334155';
  const gridColor = isDark ? '#334155' : '#D8E4F8';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#D8E4F8';

  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>
      <BarChart
        style={styles.chart}
        responsive
        data={items.map((item) => ({ ...item, name: item.label }))}
        margin={{ top: 8, right: 10, left: 0, bottom: 8 }}
      >
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
        <YAxis width={32} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
        <Tooltip
          formatter={(value) => Number(value).toLocaleString()}
          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
          labelStyle={{ color: axisColor }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {items.map((item) => (
            <Cell key={`${title}-${item.label}`} fill={item.color} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}

export default function AdminOverviewCharts({ roles, jobs, payments, applications, isDark }: Props) {
  return (
    <div style={styles.grid}>
      <PieCard title="User Roles" items={roles} isDark={isDark} />
      <BarCard title="Jobs Pipeline" items={jobs} isDark={isDark} />
      <PieCard title="Payments Status" items={payments} isDark={isDark} />
      <BarCard title="Applications Funnel" items={applications} isDark={isDark} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    marginTop: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 10
  },
  card: {
    minHeight: 290,
    border: '1px solid #D8E4F8',
    borderRadius: 14,
    background: '#FFFFFF',
    padding: 13
  },
  title: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: 8
  },
  chart: {
    width: '100%',
    height: 240
  }
};
