import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Radio, History, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldAlert size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Voice<span style={{ color: 'var(--primary)' }}>Guard</span> AI
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/dashboard') ? '#ffffff' : 'var(--text-muted)',
                  borderBottom: isActive('/dashboard') ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '0.5rem 0'
                }}
              >
                <Activity size={16} /> Dashboard
              </Link>

              <Link
                to="/detect"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/detect') ? '#ffffff' : 'var(--text-muted)',
                  borderBottom: isActive('/detect') ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '0.5rem 0'
                }}
              >
                <Radio size={16} /> Detect Voice
              </Link>

              <Link
                to="/history"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/history') ? '#ffffff' : 'var(--text-muted)',
                  borderBottom: isActive('/history') ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '0.5rem 0'
                }}
              >
                <History size={16} /> History
              </Link>

              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/profile') ? '#ffffff' : 'var(--text-muted)',
                  borderBottom: isActive('/profile') ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '0.5rem 0'
                }}
              >
                <User size={16} /> Profile
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {user?.name || user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  title="Sign out"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overview</Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div style={{ display: 'none' }} className="mobile-toggle">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          padding: '1.25rem',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/detect" onClick={() => setMobileMenuOpen(false)}>Detect Voice</Link>
              <Link to="/history" onClick={() => setMobileMenuOpen(false)}>History</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <button type="button" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-danger" style={{ width: '100%' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Overview</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
