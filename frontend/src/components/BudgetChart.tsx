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
    { name: 'Hotels', value: breakdown.hotel_cost, color: 'var(--color-primary-blue)', icon: Hotel },
    { name: 'Food', value: breakdown.food_cost, color: 'var(--color-coral-accent)', icon: Utensils },
    { name: 'Transport', value: breakdown.transportation_cost, color: 'var(--color-warning)', icon: Car },
    { name: 'Activities', value: breakdown.activity_cost, color: 'var(--color-success)', icon: Compass },
    { name: 'Misc', value: breakdown.miscellaneous_cost, color: 'var(--color-text-secondary)', icon: HelpCircle },
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
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-successSage/10 text-successSage dark:text-successSage flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-textSecondary dark:text-warmWhite">Budget Estimator</h3>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted">Analysis of predicted trip expenses</p>
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
                  borderRadius: '12px',
                  color: 'var(--color-warm-white)',
                  fontSize: '11px',
                  boxShadow: '0 2px 8px rgba(0,0,0,.08)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xs text-textSecondary dark:text-dark-text-muted  font-semibold tracking-normal">Est. Cost</span>
            <span className="text-xl font-semibold text-coral font-mono">{formatCurrency(breakdown.total_cost)}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-sm mt-1 ${
              targetBudget === breakdown.total_cost
                ? 'text-successSage bg-successSage/20 dark:bg-successSage/30'
                : percentUsed <= 100 
                ? 'text-successSage bg-successSage/10' 
                : 'text-coral bg-coral/10'
            }`}>
              {targetBudget === breakdown.total_cost ? 'exactly on budget' : `${percentUsed}% limit`}
            </span>
          </div>
        </div>

        {/* Progress Bars & Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="p-4 bg-stoneMuted dark:bg-dark-card rounded-lg border border-stoneMuted dark:border-dark-border">
              <span className="text-xs text-textSecondary dark:text-dark-text-muted block  font-semibold">Target Budget</span>
              <span className="text-sm font-semibold text-coral font-mono">{formatCurrency(targetBudget)}</span>
            </div>
            <div className={`p-4 rounded-lg border ${
              targetBudget === breakdown.total_cost
                ? 'bg-successSage/10 border-successSage/20 text-successSage dark:text-successSage'
                : 'bg-stoneMuted dark:bg-dark-card border-stoneMuted dark:border-dark-border'
            }`}>
              <span className="text-xs text-textSecondary dark:text-dark-text-muted block  font-semibold">Remaining</span>
              <span className={`text-sm font-semibold font-mono ${
                targetBudget === breakdown.total_cost
                  ? 'text-successSage dark:text-successSage'
                  : targetBudget - breakdown.total_cost >= 0 
                  ? 'text-successSage dark:text-successSage' 
                  : 'text-coral'
              }`}>
                {targetBudget === breakdown.total_cost ? 'Exactly on Budget' : formatCurrency(targetBudget - breakdown.total_cost)}
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
                      <div className="w-5 h-5 rounded-sm flex items-center justify-center text-warmWhite" style={{ backgroundColor: item.color }}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-textSecondary dark:text-dark-text-muted">{item.name}</span>
                    </div>
                    <span className="text-coral font-mono font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-stoneMuted dark:bg-dark-card h-1.5 rounded-lg overflow-hidden">
                    <div 
                      className="h-full rounded-lg transition-all duration-500" 
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
