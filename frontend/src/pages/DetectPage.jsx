import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { AudioPlayer } from '../components/AudioPlayer';
import { encodeWAV } from '../utils/wavEncoder';
import { UploadCloud, FileAudio, X, AlertCircle, ArrowRight, Mic, Square, Radio } from 'lucide-react';

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTS = ['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac'];

export const DetectPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'record'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  // Live microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const recordedSamplesRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setError('');
    recordedSamplesRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        recordedSamplesRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            // Auto stop at 30 seconds
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please grant browser microphone permission and try again.');
      setIsRecording(false);
      stopRecordingCleanup();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);

    // Stop timer and stream
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Flatten samples
    const chunks = recordedSamplesRef.current;
    let totalLength = 0;
    for (let c of chunks) totalLength += c.length;

    if (totalLength < 8000) { // < 0.5s at 16kHz
      setError('Recording too short. Please speak for at least 1-2 seconds.');
      stopRecordingCleanup();
      return;
    }

    const flatSamples = new Float32Array(totalLength);
    let offset = 0;
    for (let c of chunks) {
      flatSamples.set(c, offset);
      offset += c.length;
    }

    // Encode to standard 16kHz mono WAV
    const wavBlob = encodeWAV(flatSamples, 16000);
    const filename = `mic_recording_${Date.now()}.wav`;
    const wavFile = new File([wavBlob], filename, { type: 'audio/wav' });

    stopRecordingCleanup();
    validateAndSetFile(wavFile);
  };

  const validateAndSetFile = (file) => {
    setError('');

    if (!file) return;

    // Check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported audio format (${ext}). Supported formats: ${ALLOWED_EXTS.join(', ')}`);
      return;
    }

    // Check size
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of ${MAX_SIZE_MB} MB.`);
      return;
    }

    if (file.size === 0) {
      setError('The selected audio file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
  };

  const startAnalysis = async () => {
    if (!selectedFile) {
      setError('Please select or record an audio file first.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setUploadProgress(10);
    setAnalysisStage('Uploading audio to Spring Boot backend...');

    try {
      const timer1 = setTimeout(() => {
        setAnalysisStage('Extracting acoustic features and resampling to 16 kHz...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setAnalysisStage('Running Wav2Vec2 neural inference for synthetic clone detection...');
      }, 4000);

      const result = await voiceService.analyzeAudio(selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadProgress(100);
      setAnalysisStage('Inference complete! Persisting audit record to database...');

      setTimeout(() => {
        navigate(`/result/${result.id}`, { state: { resultData: result } });
      }, 600);

    } catch (err) {
      console.error('Analysis failed:', err);
      let msg = err.response?.data?.message || err.message || '';
      // Sanitize: if message contains HTML tags, replace with a clean fallback
      if (!msg || msg.trim().startsWith('<') || msg.length > 300) {
        msg = 'The AI service is temporarily unavailable or starting up. Please wait 30–60 seconds and try again.';
      }
      setError(msg);
      setIsAnalyzing(false);
      setUploadProgress(0);
      setAnalysisStage('');
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Analyze Audio for Voice Clones
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Upload any speech recording or record your own voice to detect whether it is authentic human speech or AI synthetic clone.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Selector Tabs (when no file selected) */}
      {!selectedFile && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`btn ${inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            <UploadCloud size={18} /> File Upload
          </button>
          <button
            type="button"
            onClick={() => setInputMode('record')}
            className={`btn ${inputMode === 'record' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Mic size={18} /> Record Live Voice
          </button>
        </div>
      )}

      {/* Upload Dropzone or Live Microphone Recorder */}
      {!selectedFile ? (
        inputMode === 'upload' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-glass)',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".wav,.mp3,.flac,.ogg,.m4a,.aac"
              onChange={handleFileChange}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <UploadCloud size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
                Drag & Drop your audio recording here
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                or click to browse your local files
              </p>
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)'
            }}>
              Supported formats: WAV, MP3, FLAC, OGG, M4A &bull; Max 20 MB &bull; Min 0.5s speech
            </div>
          </div>
        ) : (
          /* Live Microphone Recording Card */
          <div className="card" style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            border: isRecording ? '2px solid #ef4444' : '1px solid var(--border-color)',
            background: isRecording ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-glass)',
            transition: 'all 0.3s ease'
          }}>
            {/* Pulsing Mic Visualizer */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
              color: isRecording ? '#ef4444' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {isRecording ? <Radio size={40} className="pulse-anim" /> : <Mic size={40} />}
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                {isRecording ? 'Listening & Recording...' : 'Live Microphone Recording'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                {isRecording
                  ? 'Speak clearly into your microphone. Say a sentence or phrase naturally.'
                  : 'Click the record button below to capture speech directly for deepfake analysis.'}
              </p>
            </div>

            {/* Timer Display */}
            {isRecording && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: '0.08em'
              }}>
                {formatSeconds(recordingSeconds)} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ 00:30</span>
              </div>
            )}

            {/* Action Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Mic size={20} /> Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="btn"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '0.85rem 2rem',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Square size={20} /> Stop Recording
              </button>
            )}

            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Standard 16,000 Hz Mono PCM encoding &bull; Recommended 3 to 10 seconds of speech
            </span>
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Selected File Details Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <FileAudio size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', wordBreak: 'break-all' }}>
                    {selectedFile.name}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'audio/wav'}
                  </span>
                </div>
              </div>

              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={removeFile}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  title="Remove or replace file"
                >
                  <X size={16} /> Remove
                </button>
              )}
            </div>

            {/* Audio Preview Player */}
            {filePreviewUrl && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>
                  Preview Recording:
                </span>
                <AudioPlayer src={filePreviewUrl} filename={selectedFile.name} />
              </div>
            )}
          </div>

          {/* Analysis Progress or Trigger Button */}
          {isAnalyzing ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1.25rem auto' }}></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {analysisStage}
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Wav2Vec2 deep learning inference running on Hugging Face weights...
              </p>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startAnalysis}
              className="btn btn-primary"
              style={{ padding: '1rem', fontSize: '1.1rem', width: '100%' }}
            >
              Start Deepfake Detection <ArrowRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
