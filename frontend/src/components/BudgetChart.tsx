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
    { name: 'Hotels', value: breakdown.hotel_cost, color: '#0a84ff', icon: Hotel },
    { name: 'Food', value: breakdown.food_cost, color: '#f43f5e', icon: Utensils },
    { name: 'Transport', value: breakdown.transportation_cost, color: '#eab308', icon: Car },
    { name: 'Activities', value: breakdown.activity_cost, color: '#a855f7', icon: Compass },
    { name: 'Misc', value: breakdown.miscellaneous_cost, color: '#64748b', icon: HelpCircle },
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
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Budget Estimator</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Analysis of predicted trip expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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
                  backgroundColor: 'rgba(23, 23, 23, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-450 dark:text-neutral-500 uppercase font-bold tracking-wider">Est. Cost</span>
            <span className="text-xl font-extrabold text-slate-850 dark:text-white">{formatCurrency(breakdown.total_cost)}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
              percentUsed <= 100 ? 'text-emerald-650 bg-emerald-500/10' : 'text-red-650 bg-red-500/10'
            }`}>
              {percentUsed}% limit
            </span>
          </div>
        </div>

        {/* Progress Bars & Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="p-3 bg-slate-50 dark:bg-neutral-850 rounded-xl border border-slate-100 dark:border-neutral-800/60">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Target Budget</span>
              <span className="text-sm font-extrabold text-slate-700 dark:text-neutral-200">{formatCurrency(targetBudget)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-neutral-850 rounded-xl border border-slate-100 dark:border-neutral-800/60">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Remaining</span>
              <span className={`text-sm font-extrabold ${targetBudget - breakdown.total_cost >= 0 ? 'text-emerald-650 dark:text-emerald-400' : 'text-red-500'}`}>
                {formatCurrency(targetBudget - breakdown.total_cost)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((item, idx) => {
              const Icon = item.icon;
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-slate-700 dark:text-neutral-300">{item.name}</span>
                    </div>
                    <span className="text-slate-800 dark:text-white font-bold">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
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
