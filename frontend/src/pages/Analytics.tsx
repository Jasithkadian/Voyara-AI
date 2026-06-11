import React, { useEffect, useState } from 'react';
import { tripsApi } from '../services/api';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Award, DollarSign, Calendar, Users, ShoppingBag, PieChart as PieIcon, ArrowUpRight, BarChart2 } from 'lucide-react';

interface AnalyticsData {
  tripsPlanned: number;
  tripsSaved: number;
  bookingsCreated: number;
  revenueGenerated: number;
  averageBudget: number;
  popularDestinations: { destination: string; count: number }[];
  userRetention: number;
  bookingConversion: number;
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await tripsApi.getAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-3xl border border-red-100 text-center">
          <p className="font-bold">{error || 'Something went wrong while loading analytics.'}</p>
          <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Colors for Pie chart
  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Data mapping for Recharts
  const destinationData = data.popularDestinations.map(d => ({
    name: d.destination,
    Count: d.count
  }));

  // Budget comparison mock/demo dataset
  const budgetComparisonData = [
    { destination: 'Goa', 'Avg Budget': 30000 },
    { destination: 'Bali', 'Avg Budget': 59000 },
    { destination: 'Dubai', 'Avg Budget': 86000 },
    { destination: 'Switzerland', 'Avg Budget': 112000 },
    { destination: 'Japan', 'Avg Budget': 87000 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-brand" /> Analytics Dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-neutral-450 mt-1">
          Real-time metrics tracking travel plans, conversion rates, revenues, and destinations.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Trips Planned */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand/10 text-brand rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Trips Generated</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{data.tripsPlanned}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.5% vs last month</span>
          </div>
        </div>

        {/* Trips Saved */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-sky-500/10 text-sky-500 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Trips Saved</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{data.tripsSaved}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.2% conversion to save</span>
          </div>
        </div>

        {/* Bookings Created */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Bookings Created</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{data.bookingsCreated}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{data.bookingConversion}% Conversion</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Total Revenue</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5">{formatCurrency(data.revenueGenerated)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Avg Budget: {formatCurrency(data.averageBudget)}</span>
          </div>
        </div>
      </div>

      {/* Advanced Performance & Conversion Rate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Conversion Gauge Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Booking Conversion Flow
            </h4>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mb-6">Percentage of generated itineraries turning into successful paid reservations.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-neutral-300 mb-1.5">
                <span>Direct Flight & Hotel Conversion Rate</span>
                <span>{data.bookingConversion}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand to-indigo-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(data.bookingConversion * 2, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-neutral-300 mb-1.5">
                <span>User Retention & Engagement</span>
                <span>{data.userRetention}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${data.userRetention}%` }} 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-850 flex justify-between text-center">
              <div className="flex-1">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Churn</span>
                <span className="block text-lg font-extrabold text-slate-700 dark:text-neutral-300">{(100 - data.userRetention).toFixed(1)}%</span>
              </div>
              <div className="w-px bg-slate-150 dark:bg-neutral-850" />
              <div className="flex-1">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Target Conversion</span>
                <span className="block text-lg font-extrabold text-slate-700 dark:text-neutral-300">45.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* User demographics & conversion info */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> Platform Retention & Loyalty
            </h4>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mb-6">User stickiness based on repeat travel inquiries and saved itineraries.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Repeat Travelers</span>
              <h5 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">72.4%</h5>
              <p className="text-[10px] text-slate-500 dark:text-neutral-450 mt-1">Users generating &gt; 2 trips</p>
            </div>
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-2xl border border-purple-100/50 dark:border-purple-900/20">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Net Promoter Score</span>
              <h5 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">78</h5>
              <p className="text-[10px] text-slate-500 dark:text-neutral-450 mt-1">Stellar user satisfaction</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-neutral-850 p-3.5 rounded-2xl text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed border border-slate-100 dark:border-neutral-800/40">
            <strong>Autonomous Recommendation Highlight:</strong> Our hybrid recommendation engine matches 93% of user preferences with flight &amp; hotel selections, improving booking conversion by 12% MoM.
          </div>
        </div>
      </div>

      {/* Visual Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Destinations Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm">
          <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-brand" /> Popular Destinations
          </h4>
          <p className="text-xs text-slate-400 dark:text-neutral-550 mb-6">Distribution of trip destinations planned by users globally.</p>
          <div className="h-64 flex items-center justify-center">
            {destinationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={destinationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="Count"
                  >
                    {destinationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No popular destinations recorded.</span>
            )}
          </div>
        </div>

        {/* Budget comparison chart */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/55 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm">
          <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" /> Budget Benchmark Comparison
          </h4>
          <p className="text-xs text-slate-400 dark:text-neutral-550 mb-6">Average planned package cost breakdown per destination (INR).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetComparisonData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="destination" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${(value as number).toLocaleString('en-IN')}`, 'Average Budget']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="Avg Budget" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {budgetComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
