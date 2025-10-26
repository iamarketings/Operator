
// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { CallActivityData } from '../types';

interface CallActivityChartProps {
    data: CallActivityData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
          <p className="label text-sm text-text-secondary">{`${label}`}</p>
          <p className="intro font-bold text-primary">{`Appels actifs : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

const CallActivityChart: React.FC<CallActivityChartProps> = ({ data }) => {
    return (
        <div className="bg-surface rounded-lg shadow-md border border-border p-6 h-80">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Activité des appels (10 min)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="calls" stroke="#4F46E5" fillOpacity={1} fill="url(#colorCalls)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CallActivityChart;