import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Bookmark, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (paths: string[]) => {
    return paths.includes(currentPath) ? 'active' : '';
  };

  return (
    <nav className="mobile-nav md:hidden">
      <Link 
        to="/dashboard" 
        className={`mobile-nav__tab ${isActive(['/dashboard', '/dashboard/trip'])}`}
      >
        <Home size={20} />
        <span>Home</span>
      </Link>
      
      <Link 
        to="/explore" 
        className={`mobile-nav__tab ${isActive(['/explore'])}`}
      >
        <Compass size={20} />
        <span>Explore</span>
      </Link>
      
      <Link 
        to="/planner" 
        className="mobile-nav__tab mobile-nav__tab--cta"
      >
        <Plus size={24} />
      </Link>
      
      <Link 
        to="/saved-trips" 
        className={`mobile-nav__tab ${isActive(['/saved-trips', '/trip-timeline', '/my-expenses'])}`}
      >
        <Bookmark size={20} />
        <span>Trips</span>
      </Link>
      
      <Link 
        to="/profile" 
        className={`mobile-nav__tab ${isActive(['/profile'])}`}
      >
        <User size={20} />
        <span>You</span>
      </Link>
    </nav>
  );
};
