import React from 'react';
import { BudgetBreakdown } from '../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Wallet, Hotel, Utensils, Car, Compass, HelpCircle } from 'lucide-react';

interface BudgetChartProps {
  breakdown: BudgetBreakdown;
  targetBudget: number;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ breakdown, targetBudget }) => {
  const data = [
    { name: 'Hotels', value: breakdown.hotel_cost, color: '#1A56DB', icon: Hotel },
    { name: 'Food', value: breakdown.food_cost, color: '#F97316', icon: Utensils },
    { name: 'Transport', value: breakdown.transportation_cost, color: '#64748B', icon: Car },
    { name: 'Activities', value: breakdown.activity_cost, color: '#059669', icon: Compass },
    { name: 'Misc', value: breakdown.miscellaneous_cost, color: '#94A3B8', icon: HelpCircle },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const total = breakdown.total_cost || 1;
  const percentUsed = Math.round((total / targetBudget) * 100);

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-lg)] relative overflow-hidden">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-success)] flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Budget Estimator</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Analysis of predicted trip expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Pie Chart */}
        <div className="h-60 w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'var(--color-text-primary)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '11px',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Est. Cost</span>
            <span className="price text-[var(--color-accent)]">{formatCurrency(breakdown.total_cost)}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm mt-1 ${
              targetBudget === breakdown.total_cost
                ? 'text-[var(--color-success)] bg-[var(--color-success-bg)]'
                : percentUsed <= 100 
                ? 'text-[var(--color-success)] bg-[var(--color-success-bg)]' 
                : 'text-[var(--color-error)] bg-[var(--color-error-bg)]'
            }`}>
              {targetBudget === breakdown.total_cost ? 'target met' : `${percentUsed}% limit`}
            </span>
          </div>
        </div>

        {/* Progress Bars & Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="p-4 bg-[var(--color-bg-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Target Budget</span>
              <span className="price text-[var(--color-text-primary)]">{formatCurrency(targetBudget)}</span>
            </div>
            <div className={`p-4 rounded-[var(--radius-md)] border ${
              targetBudget === breakdown.total_cost
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
                : 'bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Remaining</span>
              <span className={`price ${
                targetBudget === breakdown.total_cost
                  ? 'text-[var(--color-success)]'
                  : targetBudget - breakdown.total_cost >= 0 
                  ? 'text-[var(--color-success)]' 
                  : 'text-[var(--color-error)]'
              }`}>
                {targetBudget === breakdown.total_cost ? 'Balanced' : formatCurrency(targetBudget - breakdown.total_cost)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {data.map((item, idx) => {
              const Icon = item.icon;
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-[var(--radius-xs)] flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-[var(--color-text-secondary)]">{item.name}</span>
                    </div>
                    <span className="price text-[var(--color-text-primary)]">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-[var(--color-bg-hover)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ backgroundColor: item.color, width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
