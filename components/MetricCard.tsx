
// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-surface rounded-lg shadow-md border border-border p-6 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
        <p className="text-xs text-text-secondary mt-1">{trend}</p>
      </div>
    </div>
  );
};

export default MetricCard;