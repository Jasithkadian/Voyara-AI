import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip, TripPlan } from '../services/api';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Wallet, Plus, AlertCircle, Calendar, Sparkles, HelpCircle, Utensils, Hotel, Car, Compass, Tag, Trash2, ArrowLeft } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Trips & Selected Trip
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [spentDate, setSpentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTripsData();
  }, [isAuthenticated]);

  const fetchTripsData = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getHistory();
      setTrips(data);
      
      // Select trip from state or fallback to first trip
      const stateTrip = location.state?.trip as SavedTrip | null;
      if (stateTrip) {
        const match = data.find(t => t.id === stateTrip.id);
        setSelectedTrip(match || stateTrip);
      } else if (data.length > 0) {
        setSelectedTrip(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrip) {
      fetchExpenses();
    }
  }, [selectedTrip]);

  const fetchExpenses = async () => {
    if (!selectedTrip) return;
    try {
      const expList = await tripsApi.getExpenses(selectedTrip.id);
      setExpenses(expList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !amount) return;
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      await tripsApi.addExpense({
        trip_id: selectedTrip.id,
        category,
        amount: parseFloat(amount),
        description,
        spent_date: spentDate
      });
      setSuccess('Expense logged successfully!');
      setAmount('');
      setDescription('');
      fetchExpenses();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log expense.');
    } finally {
      setFormLoading(false);
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

  if (trips.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <Wallet className="w-16 h-16 text-slate-300 dark:text-neutral-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">No active trips found</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 mb-6">
          You must plan and save at least one trip to track travel expenses.
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="px-6 py-3 bg-brand text-white font-bold rounded-2xl shadow-md hover:bg-brand-600 transition-colors"
        >
          Plan a Trip Now
        </button>
      </div>
    );
  }

  // Budget calculations
  const plan = selectedTrip?.generated_plan;
  const breakdown = plan?.budgetBreakdown || {
    hotel_cost: 0,
    food_cost: 0,
    transportation_cost: 0,
    activity_cost: 0,
    miscellaneous_cost: 0,
    total_cost: selectedTrip?.budget || 0
  };

  const spentByCategory = {
    Hotels: expenses.filter(e => e.category === 'Hotels').reduce((sum, e) => sum + e.amount, 0),
    Food: expenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0),
    Transport: expenses.filter(e => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0),
    Activities: expenses.filter(e => e.category === 'Activities').reduce((sum, e) => sum + e.amount, 0),
    Miscellaneous: expenses.filter(e => e.category === 'Miscellaneous').reduce((sum, e) => sum + e.amount, 0),
  };

  const totalSpent = Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
  const remainingBudget = (selectedTrip?.budget || 0) - totalSpent;

  // Chart 1: Spent Pie Data
  const spentPieData = [
    { name: 'Hotels', value: spentByCategory.Hotels, color: '#0a84ff' },
    { name: 'Food', value: spentByCategory.Food, color: '#f43f5e' },
    { name: 'Transport', value: spentByCategory.Transport, color: '#eab308' },
    { name: 'Activities', value: spentByCategory.Activities, color: '#a855f7' },
    { name: 'Misc', value: spentByCategory.Miscellaneous, color: '#64748b' }
  ].filter(item => item.value > 0);

  // Chart 2: Planned vs Actual Bar Data
  const comparisonBarData = [
    { name: 'Hotels', Planned: breakdown.hotel_cost, Spent: spentByCategory.Hotels },
    { name: 'Food', Planned: breakdown.food_cost, Spent: spentByCategory.Food },
    { name: 'Transport', Planned: breakdown.transportation_cost, Spent: spentByCategory.Transport },
    { name: 'Activities', Planned: breakdown.activity_cost, Spent: spentByCategory.Activities },
    { name: 'Misc', Planned: breakdown.miscellaneous_cost, Spent: spentByCategory.Miscellaneous }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl">
        <div>
          <button onClick={() => navigate(-1)} className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-1 mb-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white">Trip Expense Tracker</h2>
        </div>

        {/* Trip Switcher Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 dark:text-neutral-450 font-bold uppercase hidden md:inline">Track Trip:</span>
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => {
              const match = trips.find(t => t.id === Number(e.target.value));
              setSelectedTrip(match || null);
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-xs bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.destination} ({t.days} Days)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Logging Form & Alerts & Spent Details list */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Alerts Banner */}
          {remainingBudget < 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-950/40 text-xs font-bold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span>Overspending Warning! You have exceeded your target budget limit by {formatCurrency(Math.abs(remainingBudget))}. Limit costs immediately.</span>
              </div>
            </div>
          )}

          {/* Logging Form */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="font-bold text-base text-slate-800 dark:text-white">Log Travel Expense</h4>
              <p className="text-[11px] text-slate-400">Add an expense to audit against planned allocations.</p>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-950/30 text-xs font-semibold">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-950/30 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                  >
                    <option value="Food">🍔 Food & Dining</option>
                    <option value="Hotels">🏨 Hotels & Stay</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Activities">🏕️ Activities</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Miscellaneous">❓ Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Spent Date</label>
                <input
                  type="date"
                  required
                  value={spentDate}
                  onChange={(e) => setSpentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Seafood Dinner at Candolim"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-600 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand/10 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {formLoading ? 'Logging...' : 'Add Expense'}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm space-y-4 max-h-[400px] overflow-y-auto">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Logged Transactions</h4>
              <p className="text-[10px] text-slate-400">A detailed feed of your spending logs.</p>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-450 dark:text-neutral-500 py-4 text-center">No expenses logged yet.</p>
            ) : (
              <div className="space-y-3.5">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-3 bg-slate-50/50 dark:bg-neutral-850/40 rounded-xl border border-slate-100 dark:border-neutral-800/60 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                        <span>{exp.category}</span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">({exp.spent_date})</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{exp.description || 'No description'}</p>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Charts Comparison */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-2xl shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400">Total Budget</span>
              <span className="text-base font-extrabold text-slate-850 dark:text-white mt-1 block truncate">
                {formatCurrency(selectedTrip?.budget || 0)}
              </span>
            </div>
            
            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-2xl shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400">Actual Spent</span>
              <span className="text-base font-extrabold text-slate-855 dark:text-white mt-1 block truncate">
                {formatCurrency(totalSpent)}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-2xl shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400">Remaining</span>
              <span className={`text-base font-extrabold mt-1 block truncate ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>

          {/* Pie Chart Card */}
          {spentPieData.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Expense Distribution (Spent)</h4>
              
              <div className="h-60 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {spentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Spent</span>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Comparison */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Planned Budget vs Actual Spending</h4>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Planned" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#0a84ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
