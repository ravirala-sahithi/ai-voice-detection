import React from 'react';

export const ConfidenceGauge = ({ confidencePercent, realProbability, aiGeneratedProbability, prediction }) => {
  const realPercent = Math.round((realProbability || 0) * 100);
  const aiPercent = Math.round((aiGeneratedProbability || 0) * 100);

  const getStatusColor = () => {
    if (prediction === 'LIKELY_REAL') return 'var(--real-green)';
    if (prediction === 'AI_GENERATED') return 'var(--fake-red)';
    return 'var(--inconclusive-amber)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Primary Score Ring / Number */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Model Confidence
          </span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getStatusColor(), lineHeight: 1.1 }}>
            {confidencePercent?.toFixed(1) || 0}%
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Classification</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            {prediction === 'LIKELY_REAL' ? 'Genuine Human' : prediction === 'AI_GENERATED' ? 'Synthetic Clone' : 'Undetermined'}
          </span>
        </div>
      </div>

      {/* Probability Comparison Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <span style={{ color: '#34d399', fontWeight: 600 }}>Human Voice Probability</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{realPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${realPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.8s ease' }}></div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <span style={{ color: '#f87171', fontWeight: 600 }}>AI Voice Clone Probability</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>{aiPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${aiPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.8s ease' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
