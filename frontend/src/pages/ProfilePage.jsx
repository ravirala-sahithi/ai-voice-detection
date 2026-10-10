import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, ShieldCheck, Key, Database, LogOut } from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account & Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your researcher profile and security credentials
        </p>
      </div>

      {/* User Information Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 700
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
              {user?.name || 'Registered Researcher'}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              User ID #{user?.id || 1} &bull; Active Analyst Session
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <Mail size={14} /> Registered Email
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#f8fafc' }}>
              {user?.email}
            </span>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <Calendar size={14} /> Registration Date
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#f8fafc' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Account'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Architecture Information */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Security & Privacy Architecture
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Key size={18} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>BCrypt Password Protection</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Passwords are salted and cryptographically hashed before storing in the database.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <ShieldCheck size={18} color="var(--real-green)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>HMAC-SHA256 JWT Authorization</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Stateless session tokens secure every API transaction and enforce user record isolation.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Database size={18} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>TiDB Cloud TLS 1.2+ Encryption</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Database connection runs through secure TLS verified sockets with strict tenant segregation.
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            <LogOut size={16} /> Sign Out of System
          </button>
        </div>
      </div>
    </div>
  );
};
