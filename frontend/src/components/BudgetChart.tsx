import React from 'react';
import { BudgetBreakdown } from '../services/api';
import { Wallet, Hotel, Utensils, Car, Compass, HelpCircle } from 'lucide-react';
import { DonutChart } from './DonutChart';
import { motion } from 'framer-motion';
import { TransportMode } from '../types';

interface BudgetChartProps {
  breakdown: BudgetBreakdown;
  targetBudget: number;
  transportMode?: TransportMode;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ breakdown, targetBudget, transportMode = 'flight' }) => {
  const data = [
    { name: 'Hotels', value: breakdown.hotel_cost, color: '#2563EB', icon: Hotel },
    { name: 'Food', value: breakdown.food_cost, color: '#7C3AED', icon: Utensils },
    { name: 'Transport', value: breakdown.transportation_cost, color: '#0D9488', icon: Car },
    { name: 'Activities', value: breakdown.activity_cost, color: '#D97706', icon: Compass },
    { name: 'Emergency Buffer', value: breakdown.miscellaneous_cost, color: '#94A3B8', icon: HelpCircle },
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl text-left">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white font-display">Budget Estimator</h3>
          <p className="text-xs text-stone-400">Analysis of predicted trip expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Donut Chart */}
        <div className="h-60 w-full flex items-center justify-center relative">
          <DonutChart segments={segments} total={breakdown.total_cost} transportMode={transportMode} />
        </div>

        {/* Progress Bars & Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Target Budget</span>
              <span className="text-base font-bold text-white font-mono">{formatCurrency(targetBudget)}</span>
            </div>
            <div className={`p-4 rounded-xl border ${
              remainingBudget === 0
                ? 'bg-emerald-500/15 border-emerald-500/20'
                : remainingBudget < 0
                ? 'bg-rose-500/15 border-rose-500/20'
                : 'bg-white/5 border border-white/5'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Remaining</span>
              <span className={`text-base font-bold font-mono ${
                remainingBudget === 0
                  ? 'text-emerald-400'
                  : remainingBudget < 0 
                  ? 'text-rose-400' 
                  : 'text-white'
              }`}>
                {remainingBudget === 0 ? '₹0' : formatCurrency(remainingBudget)}
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
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-stone-300 font-sans">{item.name}</span>
                    </div>
                    <span className="text-white font-bold font-mono">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.08 }}
                      style={{ backgroundColor: item.color }}
                    />
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
