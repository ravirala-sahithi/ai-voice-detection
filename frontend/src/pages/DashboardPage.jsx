import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Radio, ShieldCheck, AlertTriangle, HelpCircle, FileAudio, ArrowRight, Trash2, Eye, PlusCircle, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await voiceService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Unable to retrieve dashboard data from TiDB server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record from TiDB?')) return;

    try {
      await voiceService.deleteResult(id);
      setDeleteMsg('Record deleted successfully.');
      fetchDashboardData();
      setTimeout(() => setDeleteMsg(''), 4000);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading TiDB analysis metrics...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Welcome Banner & Action Button */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Security Overview
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
            Welcome back, {stats?.userName || user?.name || 'Researcher'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time deepfake voice classification & persistent audit telemetry
          </p>
        </div>

        <Link to="/detect" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
          <PlusCircle size={18} /> Analyze New Audio
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {deleteMsg && (
        <div className="alert alert-success">
          <ShieldCheck size={18} />
          <span>{deleteMsg}</span>
        </div>
      )}

      {/* Real Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Analyzed */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Analyzed</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
              <FileAudio size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.totalAnalyzed ?? 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Lifetime recordings submitted</span>
        </div>

        {/* Likely Real */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Likely Genuine Real</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--real-green-bg)', color: 'var(--real-green)' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399' }}>
            {stats?.likelyRealCount ?? 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Identified as human speech</span>
        </div>

        {/* AI Generated */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Likely AI-Generated</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--fake-red-bg)', color: 'var(--fake-red)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f87171' }}>
            {stats?.aiGeneratedCount ?? 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Flagged as cloned / synthetic</span>
        </div>

        {/* Inconclusive */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Inconclusive / Neutral</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--inconclusive-amber-bg)', color: 'var(--inconclusive-amber)' }}>
              <HelpCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24' }}>
            {stats?.inconclusiveCount ?? 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Below confidence threshold</span>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Recent Audio Analyses</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Verified historical submissions from TiDB Cloud</p>
          </div>
          <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            View Full History <ArrowRight size={16} />
          </Link>
        </div>

        {(!stats?.recentAnalyses || stats.recentAnalyses.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}>
            <Radio size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              No audio files analyzed yet.
            </p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Upload a voice recording to test the Wav2Vec2 detection model.
            </p>
            <Link to="/detect" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              Analyze First Audio
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Filename</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date Analyzed</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAnalyses.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/result/${item.id}`)}
                  >
                    <td style={{ padding: '1rem', fontWeight: 500, color: '#f8fafc', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.originalFilename}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <StatusBadge prediction={item.prediction} />
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>
                      {item.confidencePercent?.toFixed(1)}%
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {item.analyzedDurationSeconds?.toFixed(1)}s
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="View Details"
                          onClick={(e) => { e.stopPropagation(); navigate(`/result/${item.id}`); }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Delete Record"
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
