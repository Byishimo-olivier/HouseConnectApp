import React from 'react';
import {
  Area,
  AreaChart,
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
import type { ChartDatum, PaymentTrendDatum } from './types';

type Props = {
  trendData: PaymentTrendDatum[];
  statusData: ChartDatum[];
  isDark: boolean;
};

export default function AdminPaymentsCharts({ trendData, statusData, isDark }: Props) {
  const axisColor = isDark ? '#CBD5E1' : '#334155';
  const gridColor = isDark ? '#334155' : '#D8E4F8';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#D8E4F8';
  const pieLegendColor = isDark ? '#E2E8F0' : '#334155';

  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <div style={styles.title}>Payments Overview</div>
        <BarChart style={styles.chart} responsive data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
          <YAxis width={48} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString()}
            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
            labelStyle={{ color: axisColor }}
          />
          <Bar dataKey="volume" fill="#2563EB" radius={[8, 8, 0, 0]} />
        </BarChart>
      </div>

      <div style={styles.card}>
        <div style={styles.title}>Transactions Trend</div>
        <AreaChart style={styles.chart} responsive data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="transactionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
          <YAxis width={40} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString()}
            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
            labelStyle={{ color: axisColor }}
          />
          <Area type="monotone" dataKey="transactions" stroke="#0EA5E9" fill="url(#transactionsGradient)" />
        </AreaChart>
      </div>

      <div style={styles.card}>
        <div style={styles.title}>Payment Status Distribution</div>
        <PieChart style={styles.chart} responsive data={statusData}>
          <Pie data={statusData} dataKey="value" nameKey="label" innerRadius="40%" outerRadius="76%" paddingAngle={2}>
            {statusData.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span style={{ color: pieLegendColor }}>{String(value)}</span>}
          />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString()}
            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
            labelStyle={{ color: axisColor }}
          />
        </PieChart>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 10
  },
  card: {
    minHeight: 290,
    border: '1px solid #D8E4F8',
    borderRadius: 14,
    background: '#FFFFFF',
    padding: 14
  },
  title: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: 10
  },
  chart: {
    width: '100%',
    height: 250
  }
};
