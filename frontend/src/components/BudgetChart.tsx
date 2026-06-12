import React from 'react';
import { BudgetBreakdown } from '../services/api';
import { Wallet, Hotel, Utensils, Car, Compass, HelpCircle } from 'lucide-react';
import { DonutChart } from './DonutChart';

interface BudgetChartProps {
  breakdown: BudgetBreakdown;
  targetBudget: number;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ breakdown, targetBudget }) => {
  const data = [
    { name: 'Hotels', value: breakdown.hotel_cost, color: '#0A1628', icon: Hotel },
    { name: 'Food', value: breakdown.food_cost, color: '#FF5733', icon: Utensils },
    { name: 'Transport', value: breakdown.transportation_cost, color: '#0D9488', icon: Car },
    { name: 'Activities', value: breakdown.activity_cost, color: '#D97706', icon: Compass },
    { name: 'Misc', value: breakdown.miscellaneous_cost, color: '#94A3B8', icon: HelpCircle },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const remainingBudget = targetBudget - breakdown.total_cost;
  
  const segments = data.map(item => ({
    label: item.name,
    value: item.value,
    color: item.color
  }));

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] relative overflow-hidden">
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
        {/* Donut Chart */}
        <div className="h-60 w-full flex items-center justify-center relative">
          <DonutChart segments={segments} total={breakdown.total_cost} />
        </div>

        {/* Progress Bars & Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="p-4 bg-[var(--color-bg-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Target Budget</span>
              <span className="price text-[var(--color-text-primary)]">{formatCurrency(targetBudget)}</span>
            </div>
            <div className={`p-4 rounded-[var(--radius-md)] border ${
              remainingBudget === 0
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
                : remainingBudget < 0
                ? 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]'
                : 'bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Remaining</span>
              <span className={`price ${
                remainingBudget === 0
                  ? 'text-[var(--color-success)]'
                  : remainingBudget < 0 
                  ? 'text-[var(--color-error)]' 
                  : 'text-[var(--color-text-primary)]'
              }`}>
                {remainingBudget === 0 ? '₹0 Remaining' : formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {data.map((item, idx) => {
              const Icon = item.icon;
              const pct = targetBudget > 0 ? (item.value / targetBudget) * 100 : 0;
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
                      style={{ backgroundColor: item.color, width: `${Math.min(pct, 100)}%` }}
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
