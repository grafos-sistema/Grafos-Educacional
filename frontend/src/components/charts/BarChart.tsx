'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  title?: string;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  xKey,
  yKeys,
  height = 300,
  title,
  horizontal = false,
}: BarChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" />
              <YAxis dataKey={xKey} type="category" />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} />
              <YAxis />
            </>
          )}
          <Tooltip />
          <Legend />
          {yKeys.map((yKey) => (
            <Bar key={yKey.key} dataKey={yKey.key} fill={yKey.color} name={yKey.name} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
