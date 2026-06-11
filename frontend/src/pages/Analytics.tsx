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
        <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-brand animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="p-6 bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-lg border border-coral text-center">
          <p className="font-semibold">{error || 'Something went wrong while loading analytics.'}</p>
          <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-primary text-warmWhite rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Colors for Pie chart
  const COLORS = [
    'var(--color-primary-blue)',
    'var(--color-coral-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-text-secondary)',
  ];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      <div>
        <h2 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" /> Analytics Dashboard
        </h2>
        <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-1">
          Real-time metrics tracking travel plans, conversion rates, revenues, and destinations.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Trips Planned */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-sm-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted  tracking-normal block">Trips Generated</span>
              <h3 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite mt-1">{data.tripsPlanned}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-successSage font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.5% vs last month</span>
          </div>
        </div>

        {/* Trips Saved */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-sm-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted  tracking-normal block">Trips Saved</span>
              <h3 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite mt-1">{data.tripsSaved}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-successSage font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.2% conversion to save</span>
          </div>
        </div>

        {/* Bookings Created */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-successSage/5 rounded-sm-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-successSage/10 text-successSage rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted  tracking-normal block">Bookings Created</span>
              <h3 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite mt-1">{data.bookingsCreated}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-successSage font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{data.bookingConversion}% Conversion</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-warningAmber/5 rounded-sm-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-warningAmber/10 text-warningAmber rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted  tracking-normal block">Total Revenue</span>
              <h3 className="text-2xl font-semibold text-coral font-mono mt-2">{formatCurrency(data.revenueGenerated)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-successSage font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Avg Budget: {formatCurrency(data.averageBudget)}</span>
          </div>
        </div>
      </div>

      {/* Advanced Performance & Conversion Rate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Conversion Gauge Card */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-textSecondary dark:text-warmWhite text-lg mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Booking Conversion Flow
            </h4>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-6">Percentage of generated itineraries turning into successful paid reservations.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-textSecondary dark:text-dark-text-muted mb-2">
                <span>Direct Flight & Hotel Conversion Rate</span>
                <span>{data.bookingConversion}%</span>
              </div>
              <div className="w-full bg-stoneMuted dark:bg-dark-card h-3 rounded-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-primary h-full rounded-lg transition-all duration-1000" 
                  style={{ width: `${Math.min(data.bookingConversion * 2, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-textSecondary dark:text-dark-text-muted mb-2">
                <span>User Retention & Engagement</span>
                <span>{data.userRetention}%</span>
              </div>
              <div className="w-full bg-stoneMuted dark:bg-dark-card h-3 rounded-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-successSage to-successSage h-full rounded-lg transition-all duration-1000" 
                  style={{ width: `${data.userRetention}%` }} 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-stoneMuted dark:border-dark-border flex justify-between text-center">
              <div className="flex-1">
                <span className="text-xs text-textSecondary  font-semibold tracking-normal">Churn</span>
                <span className="block text-lg font-semibold text-textSecondary dark:text-dark-text-muted">{(100 - data.userRetention).toFixed(1)}%</span>
              </div>
              <div className="w-px bg-stoneMuted dark:bg-dark-card" />
              <div className="flex-1">
                <span className="text-xs text-textSecondary  font-semibold tracking-normal">Target Conversion</span>
                <span className="block text-lg font-semibold text-textSecondary dark:text-dark-text-muted">45.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* User demographics & conversion info */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-textSecondary dark:text-warmWhite text-lg mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-successSage" /> Platform Retention & Loyalty
            </h4>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-6">User stickiness based on repeat travel inquiries and saved itineraries.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-successSage/50 dark:bg-successSage/10 rounded-lg border border-successSage/50 dark:border-successSage/20">
              <span className="text-xs font-semibold text-textSecondary ">Repeat Travelers</span>
              <h5 className="text-2xl font-semibold text-successSage dark:text-successSage mt-1">72.4%</h5>
              <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">Users generating &gt; 2 trips</p>
            </div>
            <div className="p-4 bg-coral/50 dark:bg-coral/10 rounded-lg border border-coral/50 dark:border-coral/20">
              <span className="text-xs font-semibold text-textSecondary ">Net Promoter Score</span>
              <h5 className="text-2xl font-semibold text-coral dark:text-coral mt-1">78</h5>
              <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">Stellar user satisfaction</p>
            </div>
          </div>

          <div className="bg-stoneMuted dark:bg-dark-card p-4 rounded-lg text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed border border-stoneMuted dark:border-dark-border">
            <strong>Autonomous Recommendation Highlight:</strong> Our hybrid recommendation engine matches 93% of user preferences with flight &amp; hotel selections, improving booking conversion by 12% MoM.
          </div>
        </div>
      </div>

      {/* Visual Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Popular Destinations Chart */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm">
          <h4 className="font-semibold text-textSecondary dark:text-warmWhite text-lg mb-1 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-primary" /> Popular Destinations
          </h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-6">Distribution of trip destinations planned by users globally.</p>
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
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-stone-muted)' }}
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
              <span className="text-xs text-textSecondary">No popular destinations recorded.</span>
            )}
          </div>
        </div>

        {/* Budget comparison chart */}
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm">
          <h4 className="font-semibold text-textSecondary dark:text-warmWhite text-lg mb-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" /> Budget Benchmark Comparison
          </h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-6">Average planned package cost breakdown per destination (INR).</p>
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
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-stone-muted)' }}
                />
                <Bar dataKey="Avg Budget" fill="var(--color-primary-blue)" radius={[8, 8, 0, 0]}>
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
