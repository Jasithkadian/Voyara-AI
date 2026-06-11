import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip, TripPlan } from '../services/api';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Button } from '../components/Button';
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

  if (trips.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <Wallet className="w-16 h-16 text-textSecondary dark:text-dark-text-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-textPrimary dark:text-warmWhite">No active trips found</h3>
        <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-2 mb-6">
          You must plan and save at least one trip to track travel expenses.
        </p>
        <Button
          onClick={() => navigate('/planner')}
          className="mx-auto"
        >
          Plan a Trip Now
        </Button>
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
    Miscellaneous: displayExpenses.filter(e => e.category === 'Miscellaneous').reduce((sum, e) => sum + e.amount, 0),
  };

  const totalSpent = Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
  const remainingBudget = (selectedTrip?.budget || 0) - totalSpent;

  // Chart 1: Spent Pie Data
  const spentPieData = [
    { name: 'Hotels', value: spentByCategory.Hotels, color: 'var(--color-primary-blue)' },
    { name: 'Food', value: spentByCategory.Food, color: 'var(--color-coral-accent)' },
    { name: 'Transport', value: spentByCategory.Transport, color: 'var(--color-warning)' },
    { name: 'Activities', value: spentByCategory.Activities, color: 'var(--color-success)' },
    { name: 'Misc', value: spentByCategory.Miscellaneous, color: 'var(--color-text-secondary)' }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-warmWhite dark:bg-dark-card p-6 border border-stoneMuted dark:border-dark-border rounded-lg">
        <div>
          <button onClick={() => navigate(-1)} className="text-xs font-semibold text-textSecondary hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h2 className="text-2xl sm:text-3xl font-sans font-semibold text-textPrimary dark:text-warmWhite">Trip Expense Tracker</h2>
        </div>

        {/* Trip Switcher Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold  hidden md:inline">Track Trip:</span>
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => {
              const match = trips.find(t => t.id === Number(e.target.value));
              setSelectedTrip(match || null);
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-sm text-textPrimary dark:text-warmWhite font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
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
            <div className="p-4 bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-md border border-coral dark:border-coral/40 text-xs font-semibold flex items-start gap-2 leading-relaxed shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-1" />
              <div>
                <span>Overspending Warning! You have exceeded your target budget limit by <span className="font-mono text-coral">{formatCurrency(Math.abs(remainingBudget))}</span>. Limit costs immediately.</span>
              </div>
            </div>
          )}

          {/* Logging Form */}
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md hover:shadow-card-hover transition-all space-y-4 shadow-sm">
            <div>
              <h4 className="font-sans font-semibold text-base text-textPrimary dark:text-warmWhite">Log Travel Expense</h4>
              <p className="text-xs text-textSecondary">Add an expense to audit against planned allocations.</p>
            </div>

            {success && (
              <div className="p-4 bg-successSage/10 text-successSage rounded-sm border border-successSage/20 text-xs font-semibold">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-sm border border-coral dark:border-coral/30 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs  font-semibold text-textSecondary">Amount (INR)</label>
                  <input
                    type="text"
                    required
                    value={amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount.replace(/[^0-9]/g, ''))) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(val);
                    }}
                    placeholder="e.g. ₹1,500"
                    className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-sm font-mono text-coral focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs  font-semibold text-textSecondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
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
                <label className="text-xs  font-semibold text-textSecondary">Spent Date</label>
                <input
                  type="date"
                  required
                  value={spentDate}
                  onChange={(e) => setSpentDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary ${!spentDate ? 'date-input-empty' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs  font-semibold text-textSecondary">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Seafood Dinner at Candolim"
                  className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                variant="primary"
                className="w-full"
              >
                <Plus className="w-4 h-4" /> {formLoading ? 'Logging...' : 'Add Expense'}
              </Button>
            </form>
          </div>

          {/* History List */}
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md hover:shadow-card-hover transition-all space-y-4 max-h-[400px] overflow-y-auto shadow-sm">
            <div>
              <h4 className="font-sans font-semibold text-sm text-textPrimary dark:text-warmWhite">Logged Transactions</h4>
              <p className="text-xs text-textSecondary">A detailed feed of your spending logs.</p>
            </div>

            <div className="space-y-4">
              {displayExpenses.map((exp) => (
                <div key={exp.id} className="p-4 bg-stoneMuted dark:bg-dark-card rounded-md border border-stoneMuted dark:border-dark-border flex justify-between items-center text-xs hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-textPrimary dark:text-warmWhite">
                      <span>{exp.category}</span>
                      <span className="text-xs text-textSecondary font-semibold font-mono">({exp.spent_date})</span>
                      {exp.isDummy && (
                        <span className="px-2 py-1 bg-stoneMuted text-xs text-textSecondary font-semibold  rounded-sm">
                          Sample
                        </span>
                      )}
                    </div>
                    <p className="text-textSecondary mt-1">{exp.description || 'No description'}</p>
                  </div>
                  <span className="font-semibold text-coral font-mono">{formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Charts Comparison */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all">
              <span className="text-xs  font-semibold text-textSecondary">Total Budget</span>
              <span className="text-base font-semibold text-coral font-mono mt-1 block truncate">
                {formatCurrency(selectedTrip?.budget || 0)}
              </span>
            </div>
            
            <div className="p-4 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all">
              <span className="text-xs  font-semibold text-textSecondary">Actual Spent</span>
              <span className="text-base font-semibold text-coral font-mono mt-1 block truncate">
                {formatCurrency(totalSpent)}
              </span>
            </div>

            <div className={`p-4 border rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all ${
              remainingBudget === 0 
                ? 'bg-successSage/10 border-successSage/20 text-successSage font-semibold'
                : 'bg-warmWhite dark:bg-dark-card border-stoneMuted dark:border-dark-border'
            }`}>
              <span className="text-xs  font-semibold text-textSecondary block">Remaining</span>
              <span className={`text-base font-semibold mt-1 block truncate ${
                remainingBudget === 0
                  ? 'text-successSage font-semibold'
                  : 'text-coral font-mono'
              }`}>
                {remainingBudget === 0 ? 'Exactly on Budget' : formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>

          {/* Pie Chart Card */}
          {spentPieData.length > 0 && (
            <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md hover:shadow-card-hover transition-all shadow-sm space-y-4">
              <h4 className="font-sans font-semibold text-sm text-textPrimary dark:text-warmWhite">Expense Distribution (Spent)</h4>
              
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
                  <span className="text-xs text-textSecondary  font-semibold tracking-normal">Total Spent</span>
                  <span className="text-lg font-semibold text-coral font-mono">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Comparison */}
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md hover:shadow-card-hover transition-all shadow-sm space-y-4">
            <h4 className="font-sans font-semibold text-sm text-textPrimary dark:text-warmWhite">Planned Budget vs Actual Spending</h4>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-stone-muted)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Planned" fill="var(--color-stone-muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="var(--color-coral-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
