import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { TripPlanner } from './pages/TripPlanner';
import { SavedTrips } from './pages/SavedTrips';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Expenses } from './pages/Expenses';
import { Analytics } from './pages/Analytics';
import { TripTimeline } from './pages/TripTimeline';
import { Demo } from './pages/Demo';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 transition-colors duration-250 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/trip" element={<Dashboard />} />
              <Route path="/my-expenses" element={<Expenses />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/saved-trips" element={<SavedTrips />} />
              <Route path="/planner" element={<TripPlanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/trip-timeline" element={<TripTimeline />} />
              <Route path="/demo" element={<Demo />} />
            </Routes>
          </main>
          
          {/* Global Footer */}
          <footer className="py-6 border-t border-slate-200/50 dark:border-neutral-800/40 text-center text-xs text-slate-400 dark:text-neutral-500 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4">
              © {new Date().getFullYear()} AI Travel Copilot V2. Built with React, FastAPI & Claude/OpenAI.
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
