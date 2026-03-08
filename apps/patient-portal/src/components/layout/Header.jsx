import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Menu, X, User, LogOut } from 'lucide-react';
import { authAPI } from '../../services/api';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth status on mount and location change
    const checkAuth = () => {
      const userInfo = authAPI.getPatientInfo();
      setUser(userInfo);
    };
    
    checkAuth();
    
    // Add event listener for storage changes (for sync across tabs)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname]);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/language', label: 'Start', state: { nextPage: '/triage' } },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Activity className="w-8 h-8" />
            <span className="text-xl font-bold">MedhaOS</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary flex items-center gap-2 py-2 px-4"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 hover:text-primary-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-3 px-4 font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full mt-4 btn-secondary flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout ({user.name})
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
