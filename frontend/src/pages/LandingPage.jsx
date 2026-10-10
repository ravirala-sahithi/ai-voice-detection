import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Cpu, Database, Zap, Lock, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '5rem 1rem 3rem 1rem',
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.75rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <ShieldAlert size={16} /> Wav2Vec2-Powered Deepfake Voice Shield
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em'
        }}>
          Detect <span className="gradient-text">AI Voice Clones</span> & Synthetic Speech in Seconds
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '720px',
          lineHeight: 1.6
        }}>
          Protect against voice phishing, audio impersonation, and generative speech fraud.
          Analyze recordings using pretrained transformer models, backed by Spring Boot 3 and TiDB Cloud.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
          {isAuthenticated ? (
            <Link to="/detect" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              Analyze New Audio <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                Sign In to Dashboard
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Multi-Tier Architecture & Capabilities
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Engineered from ground up with production security, decoupled microservices, and distributed persistence.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="card">
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '1rem'
            }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Wav2Vec2 Deepfake Detector
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Utilizes Hugging Face <code>garystafford/wav2vec2-deepfake-voice-detector</code> with 16kHz resampled acoustic feature extraction.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: '1rem'
            }}>
              <Database size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              TiDB Cloud Persistence
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Encrypted TLS connections using MySQL JDBC driver to TiDB Serverless Cloud. Stores user accounts and complete audit trails.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--real-green)',
              marginBottom: '1rem'
            }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Spring Security + JWT
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Stateless REST API secured with BCrypt password hashing, HMAC-SHA256 tokens, and per-user data segregation.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
              marginBottom: '1rem'
            }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Transparent Decision Policy
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Provides nuanced classification: <code>LIKELY_REAL</code>, <code>AI_GENERATED</code>, or <code>INCONCLUSIVE</code> with calibrated confidence margins.
            </p>
          </div>
        </div>
      </section>

      {/* How it works pipeline */}
      <section className="container">
        <div className="card" style={{ padding: '2.5rem', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
            Audio Detection Pipeline
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>01</div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Audio Upload</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>User uploads WAV, MP3, or FLAC up to 20MB</p>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>02</div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Preprocess & Normalize</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>FastAPI resamples to 16kHz mono and verifies speech energy</p>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>03</div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Neural Inference</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wav2Vec2 extracts features and generates softmax logits</p>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--real-green)', marginBottom: '0.5rem' }}>04</div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Persist & Display</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Spring Boot stores result in TiDB; React renders analysis report</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
