import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Button } from '../components/Button';
import { Wallet, Plus, AlertCircle, HelpCircle, Utensils, Hotel, Car, Compass, Trash2, ArrowLeft } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export const Expenses: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
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
    if (!selectedTrip || selectedTrip.id === 0) return;
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
        amount: parseFloat(amount.replace(/[^0-9.]/g, '')),
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
    return formatPrice(val);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-lg border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin"></div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <Wallet className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">No active trips found</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 mb-6">
          You must plan and save at least one trip to track travel expenses.
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="btn-primary mx-auto"
        >
          Plan a Trip Now
        </button>
      </div>
    );
  }

  const plan = selectedTrip?.generated_plan;
  const breakdown = plan?.budgetBreakdown || {
    hotel_cost: 0,
    food_cost: 0,
    transportation_cost: 0,
    activity_cost: 0,
    miscellaneous_cost: 0,
    total_cost: selectedTrip?.budget || 0
  };

  const dummyExpenses = [
    {
      id: 'dummy-1',
      category: 'Hotels',
      description: 'Hotel Accommodation (Deposit paid)',
      amount: Math.round((breakdown.hotel_cost || (selectedTrip?.budget ? selectedTrip.budget * 0.40 : 12000)) * 0.95),
      spent_date: selectedTrip?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      isDummy: true
    },
    {
      id: 'dummy-2',
      category: 'Food',
      description: 'Local culinary dining and street food',
      amount: Math.round((breakdown.food_cost || (selectedTrip?.budget ? selectedTrip.budget * 0.20 : 6000)) * 1.05),
      spent_date: selectedTrip?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      isDummy: true
    },
    {
      id: 'dummy-3',
      category: 'Transport',
      description: 'Cab fares and airport transfer',
      amount: Math.round((breakdown.transportation_cost || (selectedTrip?.budget ? selectedTrip.budget * 0.15 : 4500)) * 0.85),
      spent_date: selectedTrip?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      isDummy: true
    },
    {
      id: 'dummy-4',
      category: 'Activities',
      description: 'Sightseeing entrance tickets & local guide',
      amount: Math.round((breakdown.activity_cost || (selectedTrip?.budget ? selectedTrip.budget * 0.15 : 4500)) * 1.0),
      spent_date: selectedTrip?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      isDummy: true
    },
    {
      id: 'dummy-5',
      category: 'Miscellaneous',
      description: 'Emergency medicine and souvenirs',
      amount: Math.round((breakdown.miscellaneous_cost || (selectedTrip?.budget ? selectedTrip.budget * 0.10 : 3000)) * 1.15),
      spent_date: selectedTrip?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      isDummy: true
    }
  ];

  const hasLoggedExpenses = expenses.length > 0;
  const displayExpenses = hasLoggedExpenses ? expenses : dummyExpenses;

  const spentByCategory = {
    Hotels: displayExpenses.filter(e => e.category === 'Hotels').reduce((sum, e) => sum + e.amount, 0),
    Food: displayExpenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0),
    Transport: displayExpenses.filter(e => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0),
    Activities: displayExpenses.filter(e => e.category === 'Activities').reduce((sum, e) => sum + e.amount, 0),
    Miscellaneous: displayExpenses.filter(e => e.category === 'Miscellaneous' || e.category === 'Shopping').reduce((sum, e) => sum + e.amount, 0),
  };

  const totalSpent = Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
  const remainingBudget = (selectedTrip?.budget || 0) - totalSpent;

  // Chart 1: Spent Pie Data
  const spentPieData = [
    { name: 'Hotels', value: spentByCategory.Hotels, color: '#1A56DB' },
    { name: 'Food', value: spentByCategory.Food, color: '#F97316' },
    { name: 'Transport', value: spentByCategory.Transport, color: '#64748B' },
    { name: 'Activities', value: spentByCategory.Activities, color: '#059669' },
    { name: 'Misc', value: spentByCategory.Miscellaneous, color: '#94A3B8' }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-bg-card)] p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)]">
        <div>
          <button onClick={() => navigate(-1)} className="btn-ghost mb-2 -ml-3.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h2 className="page-title">Trip Expense Tracker</h2>
        </div>

        {/* Trip Switcher Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] font-semibold hidden md:inline uppercase tracking-wider">Track Trip:</span>
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => {
              const match = trips.find(t => t.id === Number(e.target.value));
              setSelectedTrip(match || null);
            }}
            className="w-full sm:w-auto px-4 py-2 text-[var(--text-xs)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left column: Logging Form & Alerts & Spent Details list */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Alerts Banner */}
          {remainingBudget < 0 && (
            <div className="p-4 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[var(--color-error-border)] text-[var(--text-sm)] font-semibold flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Overspending Warning! You have exceeded your target budget limit by <span className="price text-[var(--color-error)]">{formatCurrency(Math.abs(remainingBudget))}</span>.
              </p>
            </div>
          )}

          {/* Logging Form */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-6">
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-text-primary)]">Log Travel Expense</h4>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Add an expense to audit against planned allocations.</p>
            </div>

            {success && (
              <div className="p-4 bg-[var(--color-success-bg)] text-[var(--color-success)] rounded-[var(--radius-md)] border border-[var(--color-success-border)] text-[var(--text-sm)] font-semibold">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[var(--color-error-border)] text-[var(--text-sm)] font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-5 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Amount (INR)</label>
                  <input
                    type="text"
                    required
                    value={amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount.replace(/[^0-9]/g, ''))) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(val);
                    }}
                    placeholder="e.g. ₹1,500"
                    className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--text-sm)] font-mono text-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--text-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-semibold text-[var(--color-text-primary)]"
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

              <div className="space-y-2">
                <label className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Spent Date</label>
                <input
                  type="date"
                  required
                  value={spentDate}
                  onChange={(e) => setSpentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--text-sm)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Seafood Dinner at Candolim"
                  className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--text-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary w-full h-11"
              >
                <Plus className="w-4 h-4" /> {formLoading ? 'Logging...' : 'Add Expense'}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] space-y-6 max-h-[450px] overflow-y-auto">
            <div>
              <h4 className="font-semibold text-base text-[var(--color-text-primary)]">Logged Transactions</h4>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">A detailed feed of your spending logs.</p>
            </div>

            <div className="space-y-3">
              {displayExpenses.map((exp) => (
                <div key={exp.id} className="p-4 bg-[var(--color-bg-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)] flex justify-between items-center text-[var(--text-sm)] hover:shadow-[var(--shadow-xs)] transition-all">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                      <span>{exp.category}</span>
                      <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] font-mono">({exp.spent_date})</span>
                      {exp.isDummy && (
                        <span className="px-2 py-0.5 bg-[var(--color-bg-active)] text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-wider rounded-sm">
                          Sample
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--color-text-secondary)] mt-0.5">{exp.description || 'No description'}</p>
                  </div>
                  <span className="price text-[var(--color-accent)]">{formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Charts Comparison */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Budget</span>
              <span className="price text-[var(--color-text-primary)] mt-1 block truncate">
                {formatCurrency(selectedTrip?.budget || 0)}
              </span>
            </div>
            
            <div className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Actual Spent</span>
              <span className="price text-[var(--color-accent)] mt-1 block truncate">
                {formatCurrency(totalSpent)}
              </span>
            </div>

            <div className={`p-5 rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)] ${
              remainingBudget === 0 
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">Remaining</span>
              <span className={`price mt-1 block truncate ${
                remainingBudget === 0
                  ? 'text-[var(--color-success)]'
                  : remainingBudget < 0 
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-success)]'
              }`}>
                {remainingBudget === 0 ? 'Balanced' : formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>

          {/* Pie Chart Card */}
          {spentPieData.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-8">
              <h4 className="font-semibold text-base text-[var(--color-text-primary)]">Expense Distribution (Spent)</h4>
              
              <div className="h-64 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {spentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Total Spent</span>
                  <span className="price text-[var(--color-accent)] text-lg">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Comparison */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-8">
            <h4 className="font-semibold text-base text-[var(--color-text-primary)]">Planned Budget vs Actual Spending</h4>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                  <Bar dataKey="Planned" fill="var(--color-border-strong)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#EA5320" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
