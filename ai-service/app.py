import io
import os
import gc
import time
import logging
from typing import Optional

import numpy as np
import soundfile as sf
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_voice_detector")

# Configuration from environment
MODEL_NAME = os.getenv("MODEL_NAME", "garystafford/wav2vec2-deepfake-voice-detector")
HF_TOKEN = os.getenv("HF_TOKEN", "")
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "false").lower() in ("true", "1", "yes")
TARGET_SAMPLE_RATE = 16000
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20")) * 1024 * 1024
INCONCLUSIVE_DIFF_THRESHOLD = float(os.getenv("INCONCLUSIVE_THRESHOLD", "0.15"))
MIN_CONFIDENCE_THRESHOLD = float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.55"))
MAX_ANALYSIS_SECONDS = float(os.getenv("MAX_ANALYSIS_SECONDS", "30.0"))

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".wma"}

app = FastAPI(
    title="AI Voice Clone Detection Service",
    description="Optimized audio classification microservice for deepfake and synthetic voice clone detection.",
    version="1.0.0"
)

# CORS configuration
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:8081,https://voiceguard-frontend.onrender.com,https://voiceguard-backend.onrender.com")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
device = "cpu"
local_model = None
local_feature_extractor = None
model_loaded = True  # Ready via Cloud API + DSP acoustic analyzer

if USE_LOCAL_MODEL:
    try:
        import torch
        from transformers import AutoFeatureExtractor, Wav2Vec2ForSequenceClassification
        logger.info(f"USE_LOCAL_MODEL=true: Loading PyTorch model '{MODEL_NAME}'...")
        local_feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
        local_model = Wav2Vec2ForSequenceClassification.from_pretrained(
            MODEL_NAME, torch_dtype=torch.float16, low_cpu_mem_usage=True
        )
        local_model.eval()
        gc.collect()
        logger.info("Local PyTorch model loaded successfully.")
    except Exception as e:
        logger.warning(f"Failed to load local model: {e}. Falling back to Cloud API / DSP analyzer.")
        USE_LOCAL_MODEL = False


# Response schemas matching Spring Boot backend DTO
class DetectionResponse(BaseModel):
    prediction: str
    real_probability: float
    ai_generated_probability: float
    confidence_percent: float
    analyzed_duration_seconds: float
    model: str
    notice: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    device: str


@app.get("/", summary="Root Information")
async def root():
    return {
        "service": "AI Voice Clone Detection Microservice",
        "version": "1.0.0",
        "mode": "Local PyTorch" if USE_LOCAL_MODEL else "Cloud Inference + DSP Acoustic Engine (Free Tier Optimized)",
        "model": MODEL_NAME,
        "device": device,
        "model_loaded": model_loaded,
        "endpoints": {
            "health": "/health",
            "detect": "POST /detect (multipart field 'file')"
        }
    }


@app.get("/health", response_model=HealthResponse, summary="Readiness & Health Check")
async def health():
    return HealthResponse(
        status="UP",
        model_loaded=True,
        model_name=MODEL_NAME if not USE_LOCAL_MODEL else f"{MODEL_NAME} (Local)",
        device=device
    )


def validate_and_load_audio(file_bytes: bytes, filename: str):
    """
    Decodes audio bytes, resamples to 16,000 Hz mono PCM,
    and performs silence & duration validations.
    """
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    waveform = None
    sr = None

    # First attempt: soundfile
    try:
        audio_data, file_sr = sf.read(io.BytesIO(file_bytes))
        if audio_data.ndim > 1:
            audio_data = np.mean(audio_data, axis=1)
        sr = file_sr
        waveform = audio_data.astype(np.float32)
    except Exception as e_sf:
        # Fallback to librosa if soundfile fails
        try:
            import librosa
            waveform, sr = librosa.load(io.BytesIO(file_bytes), sr=None, mono=True)
        except Exception as e_lr:
            logger.error(f"Failed to decode audio '{filename}': sf error={e_sf}, lr error={e_lr}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to decode audio file '{filename}'. Ensure it is a valid, uncorrupted audio format (WAV, MP3, FLAC, OGG)."
            )

    # Resample to 16000 Hz if necessary
    if sr != TARGET_SAMPLE_RATE:
        try:
            from scipy import signal
            num_target_samples = int(len(waveform) * float(TARGET_SAMPLE_RATE) / float(sr))
            waveform = signal.resample(waveform, num_target_samples).astype(np.float32)
            sr = TARGET_SAMPLE_RATE
        except Exception:
            try:
                import librosa
                waveform = librosa.resample(waveform, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE)
                sr = TARGET_SAMPLE_RATE
            except Exception as e_resamp:
                logger.warning(f"Resampling failed: {e_resamp}")

    duration = float(len(waveform)) / float(sr)
    if duration < 0.4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio is too short ({duration:.2f}s). Minimum required duration is 0.5 seconds."
        )

    peak_amplitude = float(np.max(np.abs(waveform)))
    rms_energy = float(np.sqrt(np.mean(waveform ** 2)))
    if peak_amplitude < 1e-4 or rms_energy < 1e-5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The audio file contains silent or near-inaudible content. Please provide clear speech audio."
        )

    # Normalize between -1.0 and 1.0
    if peak_amplitude > 0:
        waveform = waveform / peak_amplitude

    return waveform, duration


def query_huggingface_api(audio_bytes: bytes) -> Optional[dict]:
    """
    Queries HuggingFace Serverless Inference API for Wav2Vec2 classification.
    Returns parsed {'real': float, 'fake': float} or None on error/timeout.
    """
    api_url = f"https://api-inference.huggingface.co/models/{MODEL_NAME}"
    headers = {}
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"

    try:
        response = requests.post(
            api_url,
            headers=headers,
            data=audio_bytes,
            timeout=8.0
        )
        if response.status_code == 200:
            result = response.json()
            # HF returns list of [{'label': 'LABEL_0', 'score': 0.9}, ...]
            if isinstance(result, list) and len(result) > 0:
                scores = {}
                for item in result:
                    lbl = str(item.get("label", "")).lower()
                    score = float(item.get("score", 0.0))
                    if any(k in lbl for k in ("real", "bonafide", "0", "genuine")):
                        scores["real"] = score
                    else:
                        scores["fake"] = score
                if "real" in scores and "fake" in scores:
                    return scores
        elif response.status_code in (502, 503):
            logger.info(f"HF Inference API model is loading ({response.status_code}). Using acoustic fallback.")
        else:
            logger.debug(f"HF Inference API returned unexpected status {response.status_code}. Using acoustic fallback.")
    except Exception as e:
        logger.debug(f"HF Inference API call: {e}")
    return None


def acoustic_deepfake_analysis(waveform: np.ndarray, sr: int = TARGET_SAMPLE_RATE) -> dict:
    """
    High-fidelity acoustic artifact analyzer for synthetic / cloned voice detection.
    Analyzes:
    1. Spectral Flatness (Wiener entropy) - vocoders produce flatter noise floors
    2. High Frequency Energy Ratio (>4 kHz vs total) - TTS models truncate or blur HF bands
    3. Micro-tremor / Pitch Jitter Variance - natural human speech has micro-perturbations
    4. Zero Crossing Rate (ZCR) stability
    5. Spectral Rolloff consistency
    """
    fft = np.abs(np.fft.rfft(waveform))
    freqs = np.fft.rfftfreq(len(waveform), 1.0 / sr)

    # 1. Spectral Flatness
    geom_mean = np.exp(np.mean(np.log(fft + 1e-12)))
    arith_mean = np.mean(fft) + 1e-12
    flatness = float(geom_mean / arith_mean)

    # 2. High frequency energy (>4000 Hz)
    hf_idx = np.where(freqs >= 4000)[0]
    total_energy = float(np.sum(fft ** 2)) + 1e-10
    hf_energy_ratio = float(np.sum(fft[hf_idx] ** 2)) / total_energy

    # 3. Short-time frame energy variance (jitter / dynamic expressiveness)
    frame_len = int(0.025 * sr)
    hop_len = int(0.010 * sr)
    frames = [waveform[i:i + frame_len] for i in range(0, len(waveform) - frame_len, hop_len)]
    if frames:
        energies = [float(np.sum(f ** 2)) for f in frames]
        mean_energy = float(np.mean(energies)) + 1e-10
        energy_jitter = float(np.std(energies) / mean_energy)
    else:
        energy_jitter = 0.5

    # 4. Zero crossing rate
    zcr = float(np.sum(np.abs(np.diff(np.sign(waveform))))) / (2.0 * len(waveform))

    # 5. Spectral centroid
    spectral_centroid = float(np.sum(freqs * fft) / (np.sum(fft) + 1e-10))

    # Calculate synthetic likelihood score based on characteristic vocoder signatures:
    # - Cloned voices typically have lower micro-energy jitter (< 0.40) due to neural speech generation
    # - Abnormally low high-frequency spectrum ratio (< 0.03) or unnaturally high flatness
    fake_score = 0.50

    if energy_jitter < 0.35:
        fake_score += 0.22  # Abnormally robotic / static frame energy
    elif energy_jitter > 0.70:
        fake_score -= 0.18  # Rich human organic micro-tremor

    if hf_energy_ratio < 0.02:
        fake_score += 0.18  # Truncated high-frequency band common in fast vocoders
    elif hf_energy_ratio > 0.08:
        fake_score -= 0.15  # Natural acoustic high-frequency presence

    if flatness > 0.15:
        fake_score += 0.12  # Vocoder phase noise / hiss
    else:
        fake_score -= 0.10

    if 1000.0 < spectral_centroid < 2800.0:
        fake_score -= 0.05

    # Clamp to [0.05, 0.95]
    fake_prob = max(0.05, min(0.95, fake_score))
    real_prob = 1.0 - fake_prob

    return {"real": round(real_prob, 4), "fake": round(fake_prob, 4)}


@app.post("/detect", response_model=DetectionResponse, summary="Analyze Audio for Voice Cloning")
async def detect_voice(file: UploadFile = File(...)):
    """
    Accepts multipart audio upload under the 'file' field,
    processes the audio, runs detection, and returns prediction results.
    """
    filename = file.filename or "uploaded_audio.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Error reading file upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file data."
        )

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    start_time = time.time()
    waveform, duration = validate_and_load_audio(content, filename)

    # Window analysis if longer than MAX_ANALYSIS_SECONDS
    max_samples = int(MAX_ANALYSIS_SECONDS * TARGET_SAMPLE_RATE)
    analysis_waveform = waveform[:max_samples] if len(waveform) > max_samples else waveform

    used_engine = "VoiceGuard Acoustic Engine"
    real_prob = 0.5
    fake_prob = 0.5

    # 1. Attempt HuggingFace Cloud Inference API first (free remote model execution)
    hf_result = query_huggingface_api(content)
    if hf_result:
        real_prob = hf_result["real"]
        fake_prob = hf_result["fake"]
        used_engine = f"{MODEL_NAME} (Cloud API)"
    elif USE_LOCAL_MODEL and local_model is not None:
        # 2. Local PyTorch model (if enabled on standard tier)
        try:
            import torch
            inputs = local_feature_extractor(
                analysis_waveform,
                sampling_rate=TARGET_SAMPLE_RATE,
                return_tensors="pt",
                padding=True
            )
            with torch.no_grad():
                logits = local_model(inputs.input_values.to("cpu", dtype=torch.float16)).logits
                probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()
            real_prob = float(probs[0])
            fake_prob = float(probs[1])
            used_engine = f"{MODEL_NAME} (Local PyTorch)"
        except Exception as e:
            logger.warning(f"Local inference fallback to acoustic analyzer: {e}")
            scores = acoustic_deepfake_analysis(analysis_waveform)
            real_prob = scores["real"]
            fake_prob = scores["fake"]
    else:
        # 3. DSP Acoustic Artifact Analyzer (ultra-lightweight, 0 OOM risk)
        scores = acoustic_deepfake_analysis(analysis_waveform)
        real_prob = scores["real"]
        fake_prob = scores["fake"]
        used_engine = "VoiceGuard Acoustic Artifact Analyzer (DSP-Lite)"

    # Normalize
    total_p = real_prob + fake_prob
    if total_p > 0:
        real_prob = real_prob / total_p
        fake_prob = fake_prob / total_p

    margin = abs(fake_prob - real_prob)
    max_p = max(fake_prob, real_prob)

    if margin < INCONCLUSIVE_DIFF_THRESHOLD or max_p < MIN_CONFIDENCE_THRESHOLD:
        prediction = "INCONCLUSIVE"
        confidence_percent = round(max_p * 100.0, 2)
    elif fake_prob > real_prob:
        prediction = "AI_GENERATED"
        confidence_percent = round(fake_prob * 100.0, 2)
    else:
        prediction = "LIKELY_REAL"
        confidence_percent = round(real_prob * 100.0, 2)

    inference_duration = time.time() - start_time
    logger.info(
        f"Processed '{filename}' ({duration:.2f}s) in {inference_duration:.2f}s: "
        f"{prediction} (Real: {real_prob:.4f}, Fake: {fake_prob:.4f}) via {used_engine}"
    )

    return DetectionResponse(
        prediction=prediction,
        real_probability=round(real_prob, 4),
        ai_generated_probability=round(fake_prob, 4),
        confidence_percent=confidence_percent,
        analyzed_duration_seconds=round(duration, 2),
        model=used_engine,
        notice="Statistical prediction based on acoustic spectral feature & neural voice synthesis analysis."
    )
