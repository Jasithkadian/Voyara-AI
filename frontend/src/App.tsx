import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import { CurrencyProvider } from './context/CurrencyProvider';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { CommandPalette } from './components/CommandPalette';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { TripPlanner } from './pages/TripPlanner';
import { SavedTrips } from './pages/SavedTrips';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Demo } from './pages/Demo';
import { Onboarding } from './pages/Onboarding';
import { SharedTrip } from './pages/SharedTrip';
import { Explore } from './pages/Explore';
import { TripLoadingPage } from './pages/TripLoadingPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const darkRoutes = ['/planner', '/dashboard', '/chat', '/saved-trips', '/my-expenses', '/profile', '/analytics', '/trip-timeline'];
    const isDarkRoute = darkRoutes.some(route => location.pathname.startsWith(route));
    
    if (isDarkRoute) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [location.pathname]);

  return (
    <div 
      className={`min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] transition-colors duration-300 flex ${
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
              <Route path="/planner/loading" element={<TripLoadingPage />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/share/:token" element={<SharedTrip />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <footer className="py-6 border-t border-stoneMuted/50 dark:border-dark-border/40 text-center text-xs text-textSecondary dark:text-dark-text-muted bg-warmWhite/50 dark:bg-dark-card/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4">
              © {new Date().getFullYear()} voira. All rights reserved.
            </div>
          </footer>
        </>
      ) : (
        <>
          <Sidebar />
          <div className="flex-1 h-screen overflow-y-auto flex flex-col justify-between">
            <main className="flex-grow w-full">
              <div key={location.pathname} className="page-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/register" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/trip" element={<Dashboard />} />
                  <Route path="/my-expenses" element={<SavedTrips defaultTab="expenses" />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/saved-trips" element={<SavedTrips defaultTab="list" />} />
                  <Route path="/planner" element={<TripPlanner />} />
                  <Route path="/planner/loading" element={<TripLoadingPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/analytics" element={<SavedTrips defaultTab="analytics" />} />
                  <Route path="/trip-timeline" element={<SavedTrips defaultTab="timeline" />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/share/:token" element={<SharedTrip />} />
                  <Route path="/explore" element={<Explore />} />
                  {/* Short redirects */}
                  <Route path="/plan" element={<Navigate to="/planner" replace />} />
                  <Route path="/my-trips" element={<Navigate to="/saved-trips" replace />} />
                  <Route path="/settings" element={<Navigate to="/profile" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
          <MobileNav />
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
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

