import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
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
import { Onboarding } from './pages/Onboarding';
import { SharedTrip } from './pages/SharedTrip';
import { Explore } from './pages/Explore';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div 
      className={`min-h-screen bg-warmWhite dark:bg-dark-bg text-textPrimary dark:text-dark-text transition-colors duration-250 flex ${
        isAuthenticated ? 'flex-row' : 'flex-col'
      } font-sans`}
    >
      {!isAuthenticated ? (
        <>
          <Navbar />
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/planner" element={<TripPlanner />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/share/:token" element={<SharedTrip />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          
          <footer className="py-6 border-t border-stoneMuted/50 dark:border-dark-border/40 text-center text-xs text-textSecondary dark:text-dark-text-muted bg-warmWhite/50 dark:bg-dark-card/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4">
              © {new Date().getFullYear()} Voira AI. All rights reserved.
            </div>
          </footer>
        </>
      ) : (
        <>
          <Sidebar />
          <div className="flex-1 h-screen overflow-y-auto flex flex-col justify-between">
            <main className="flex-grow w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/trip" element={<Dashboard />} />
                <Route path="/my-expenses" element={<SavedTrips defaultTab="expenses" />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/saved-trips" element={<SavedTrips defaultTab="list" />} />
                <Route path="/planner" element={<TripPlanner />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/analytics" element={<SavedTrips defaultTab="analytics" />} />
                <Route path="/trip-timeline" element={<SavedTrips defaultTab="timeline" />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/share/:token" element={<SharedTrip />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </>
      )}
      <CommandPalette />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <AppContent />
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

