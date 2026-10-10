import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceGauge } from '../components/ConfidenceGauge';
import { ShieldAlert, Clock, Cpu, FileAudio, Calendar, ArrowLeft, PlusCircle, AlertCircle, Info, Printer } from 'lucide-react';

export const ResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(location.state?.resultData || null);
  const [loading, setLoading] = useState(!location.state?.resultData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!result && id) {
      const fetchResult = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await voiceService.getResult(id);
          setResult(data);
        } catch (err) {
          console.error('Failed to load result:', err);
          setError(err.response?.data?.message || 'Analysis record not found or access denied.');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [id, result]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Fetching analysis report from TiDB Cloud...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error || 'Unable to locate analysis record.'}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to History
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            title="Print or save forensic certificate as PDF"
          >
            <Printer size={16} /> Print / Export PDF
          </button>

          <Link to="/detect" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Analyze Another File
          </Link>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="card" style={{ padding: '2.5rem' }}>
        {/* Header with Classification Badge */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1.75rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Analysis Result Report #{result.id}
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem', wordBreak: 'break-all' }}>
              {result.originalFilename}
            </h1>
          </div>

          <div>
            <StatusBadge prediction={result.prediction} />
          </div>
        </div>

        {/* Confidence Gauge & Probability Breakdown */}
        <ConfidenceGauge
          confidencePercent={result.confidencePercent}
          realProbability={result.realProbability}
          aiGeneratedProbability={result.aiGeneratedProbability}
          prediction={result.prediction}
        />

        {/* Technical Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginTop: '2.5rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
              <Clock size={14} /> Analyzed Duration
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {result.analyzedDurationSeconds?.toFixed(2)} seconds
            </span>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
              <Cpu size={14} /> AI Classification Model
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a5b4fc', wordBreak: 'break-all' }}>
              {result.modelName}
            </span>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
              <Calendar size={14} /> Analysis Timestamp
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {new Date(result.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Experimental Disclaimer Alert */}
      <div className="alert alert-warning" style={{ alignItems: 'center' }}>
        <Info size={22} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Research & Experimental Notice</strong>
          <span>
            {result.notice || 'Predictions are experimental statistical AI estimates based on acoustic representations and spectral features. Confidence reflects neural model likelihood and does not constitute definitive proof of voice authenticity.'}
          </span>
        </div>
      </div>
    </div>
  );
};
