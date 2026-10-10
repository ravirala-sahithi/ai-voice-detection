# AI Voice Clone Detection Service (FastAPI + Hugging Face)

FastAPI microservice providing real-time AI voice clone and deepfake audio detection using a pretrained Wav2Vec2 sequence classification model (`garystafford/wav2vec2-deepfake-voice-detector`).

---

## 1. Features
- **Real Pretrained Model Inference**: Wav2Vec2 fine-tuned for deepfake voice detection.
- **Robust Audio Preprocessing**:
  - Resampling to target 16,000 Hz mono PCM format.
  - Handling of diverse formats (WAV, MP3, FLAC, OGG, M4A).
  - Detection of silent, empty, corrupt, and unsupported audio files.
- **Configurable Decision Policy**:
  - `LIKELY_REAL`: Probability of genuine human speech is dominant.
  - `AI_GENERATED`: Probability of synthetic or cloned speech is dominant.
  - `INCONCLUSIVE`: Margin between real and fake is too narrow or audio lacks sufficient distinct features.
- **Clean Health & Metrics**:
  - `GET /health` reports service readiness, loaded model, and hardware device (CPU/CUDA).

---

## 2. API Endpoints

### `GET /`
Returns service metadata and active configuration.

### `GET /health`
Returns readiness status:
```json
{
  "status": "UP",
  "model_loaded": true,
  "model_name": "garystafford/wav2vec2-deepfake-voice-detector",
  "device": "cpu"
}
```

### `POST /detect`
Accepts a multipart file upload (`file`) and returns inference analysis:
```json
{
  "prediction": "AI_GENERATED",
  "real_probability": 0.1245,
  "ai_generated_probability": 0.8755,
  "confidence_percent": 87.55,
  "analyzed_duration_seconds": 4.82,
  "model": "garystafford/wav2vec2-deepfake-voice-detector",
  "notice": "Experimental prediction, not proof of authenticity."
}
```

---

## 3. Installation & Run (Windows)

1. Create and activate virtual environment:
   ```powershell
   py -3.10 -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Start FastAPI server:
   ```powershell
   uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Access Swagger documentation at: `http://127.0.0.1:8000/docs`
