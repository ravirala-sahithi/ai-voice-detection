import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Trash2, Eye, PlusCircle, AlertCircle, Radio, Clock, ShieldCheck, Download } from 'lucide-react';

export const HistoryPage = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await voiceService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('History load error:', err);
      setError('Failed to fetch analysis history from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this record from TiDB Cloud?')) return;

    try {
      await voiceService.deleteResult(id);
      setFeedbackMsg('Analysis record deleted successfully.');
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = ['ID', 'Filename', 'Prediction', 'Confidence Percent', 'Real Probability', 'AI Generated Probability', 'Duration Seconds', 'Model', 'Timestamp'];
    const rows = history.map(item => [
      item.id,
      `"${(item.originalFilename || '').replace(/"/g, '""')}"`,
      item.prediction,
      item.confidencePercent,
      item.realProbability,
      item.aiGeneratedProbability,
      item.analyzedDurationSeconds,
      `"${(item.modelName || '').replace(/"/g, '""')}"`,
      `"${item.createdAt}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voiceguard_audit_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.originalFilename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPrediction === 'ALL' || item.prediction === filterPrediction;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving your analysis history from database...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Analysis History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Persistent historical voice clone assessments stored in database
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {history.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="btn btn-secondary"
              title="Export complete audit history as CSV"
            >
              <Download size={18} /> Export CSV
            </button>
          )}
          <Link to="/detect" className="btn btn-primary">
            <PlusCircle size={18} /> New Voice Analysis
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="alert alert-success">
          <ShieldCheck size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by audio filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 1 240px' }}>
          <Filter size={16} style={{ color: 'var(--text-dim)' }} />
          <select
            className="form-input"
            value={filterPrediction}
            onChange={(e) => setFilterPrediction(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="ALL">All Classifications ({history.length})</option>
            <option value="LIKELY_REAL">Likely Real Speech</option>
            <option value="AI_GENERATED">AI Voice Clone</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
          </select>
        </div>
      </div>

      {/* History List Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}>
            <Radio size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {history.length === 0 ? 'No analyses found in your history.' : 'No analyses match the active search or filter criteria.'}
            </p>
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
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/result/${item.id}`)}
                  >
                    <td style={{ padding: '1rem', fontWeight: 500, color: '#f8fafc', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
