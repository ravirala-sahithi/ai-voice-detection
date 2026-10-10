import React from 'react';
import { Database, Cpu, Server, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(10, 13, 20, 0.95)',
      padding: '2.5rem 0 2rem 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              VoiceGuard AI Detection System
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '500px' }}>
              Academic Full-Stack Deepfake & Voice Clone Identification Framework powered by Hugging Face Wav2Vec2, Spring Boot 3, and TiDB Cloud.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Code size={14} color="var(--primary)" /> React + Vite
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={14} color="var(--accent-cyan)" /> Spring Boot 3
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="var(--accent-purple)" /> FastAPI & PyTorch
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={14} color="var(--real-green)" /> TiDB Cloud
            </span>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            © {new Date().getFullYear()} VoiceGuard AI. Built for College Engineering Capstone Project.
          </div>
          <div>
            Notice: Predictions are statistical AI estimates and do not constitute forensic certification.
          </div>
        </div>
      </div>
    </footer>
  );
};
