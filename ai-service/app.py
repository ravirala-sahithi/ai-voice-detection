import io
import os
import time
import logging
from typing import Optional

import numpy as np
import soundfile as sf
import librosa
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoFeatureExtractor, Wav2Vec2ForSequenceClassification, AutoModelForAudioClassification

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_voice_detector")

# Configuration from environment
MODEL_NAME = os.getenv("MODEL_NAME", "garystafford/wav2vec2-deepfake-voice-detector")
TARGET_SAMPLE_RATE = 16000
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20")) * 1024 * 1024
INCONCLUSIVE_DIFF_THRESHOLD = float(os.getenv("INCONCLUSIVE_THRESHOLD", "0.15"))
MIN_CONFIDENCE_THRESHOLD = float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.55"))
MAX_ANALYSIS_SECONDS = float(os.getenv("MAX_ANALYSIS_SECONDS", "30.0"))

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".wma"}

app = FastAPI(
    title="AI Voice Clone Detection Service",
    description="Pretrained Wav2Vec2 audio classification microservice for deepfake and voice clone detection.",
    version="1.0.0"
)

# CORS configuration
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:8081")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
device = "cuda" if torch.cuda.is_available() else "cpu"
feature_extractor = None
model = None
model_loaded = False
label_map = {"real": 0, "fake": 1}

def load_ai_model():
    """Load pretrained feature extractor and sequence classification model."""
    global feature_extractor, model, model_loaded, label_map
    logger.info(f"Loading model '{MODEL_NAME}' on device '{device}'...")
    try:
        feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
        try:
            model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_NAME)
        except Exception:
            model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
        model.to(device)
        model.eval()

        # Parse id2label to accurately map real vs fake indices
        id2label = getattr(model.config, "id2label", {0: "real", 1: "fake"})
        logger.info(f"Model id2label mapping: {id2label}")

        real_idx = 0
        fake_idx = 1
        for idx_key, lbl in id2label.items():
            idx = int(idx_key)
            lbl_lower = lbl.lower()
            if "real" in lbl_lower or "genuine" in lbl_lower or "bonafide" in lbl_lower:
                real_idx = idx
            elif "fake" in lbl_lower or "spoof" in lbl_lower or "ai" in lbl_lower or "clone" in lbl_lower:
                fake_idx = idx

        label_map = {"real": real_idx, "fake": fake_idx}
        model_loaded = True
        logger.info(f"Model successfully loaded. Real index: {real_idx}, Fake index: {fake_idx}")
    except Exception as e:
        logger.error(f"Failed to load model '{MODEL_NAME}': {e}", exc_info=True)
        model_loaded = False

@app.on_event("startup")
async def startup_event():
    load_ai_model()

# Response schemas
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
        status="UP" if model_loaded else "DEGRADED",
        model_loaded=model_loaded,
        model_name=MODEL_NAME,
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

    # Decode audio using librosa or soundfile
    waveform = None
    sr = None
    try:
        # First attempt: librosa load from memory
        waveform, sr = librosa.load(io.BytesIO(file_bytes), sr=TARGET_SAMPLE_RATE, mono=True)
    except Exception as e1:
        logger.warning(f"librosa.load failed for {filename}: {e1}. Trying soundfile fallback...")
        try:
            audio_data, file_sr = sf.read(io.BytesIO(file_bytes))
            # Convert multi-channel to mono
            if audio_data.ndim > 1:
                audio_data = np.mean(audio_data, axis=1)
            # Resample if needed
            if file_sr != TARGET_SAMPLE_RATE:
                waveform = librosa.resample(audio_data, orig_sr=file_sr, target_sr=TARGET_SAMPLE_RATE)
            else:
                waveform = audio_data
            sr = TARGET_SAMPLE_RATE
        except Exception as e2:
            logger.error(f"Failed to decode audio {filename}: {e2}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to decode audio file '{filename}'. Ensure it is a valid, uncorrupted audio format (WAV, MP3, FLAC, OGG)."
            )

    # Validate audio length
    duration = float(len(waveform)) / float(sr)
    if duration < 0.4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio is too short ({duration:.2f}s). Minimum required duration is 0.5 seconds."
        )

    # Validate non-silence
    peak_amplitude = float(np.max(np.abs(waveform)))
    rms_energy = float(np.sqrt(np.mean(waveform ** 2)))
    if peak_amplitude < 1e-4 or rms_energy < 1e-5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The audio file contains silent or near-inaudible content. Please provide clear speech audio."
        )

    # Normalize audio waveform between -1.0 and 1.0 to ensure consistent feature extraction
    if peak_amplitude > 0:
        waveform = waveform / peak_amplitude

    return waveform, duration

@app.post("/detect", response_model=DetectionResponse, summary="Analyze Audio for Voice Cloning")
async def detect_voice(file: UploadFile = File(...)):
    """
    Accepts multipart audio upload under the 'file' field,
    processes the audio, runs model inference, and returns prediction results.
    """
    if not model_loaded:
        # Try loading on-demand if startup had delayed internet access
        load_ai_model()
        if not model_loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI detection model is currently not available. Please check server logs."
            )

    filename = file.filename or "uploaded_audio.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read uploaded file content safely
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

    # Preprocess & validate audio
    waveform, duration = validate_and_load_audio(content, filename)

    # For long audio recordings (e.g. 5 minutes), cap inference window to representative speech segment
    # to avoid quadratic attention latency/timeout while maintaining high detection fidelity.
    max_samples = int(MAX_ANALYSIS_SECONDS * TARGET_SAMPLE_RATE)
    if len(waveform) > max_samples:
        inference_waveform = waveform[:max_samples]
        logger.info(f"Audio '{filename}' duration is {duration:.2f}s; analyzing first {MAX_ANALYSIS_SECONDS}s segment for inference.")
    else:
        inference_waveform = waveform

    # Run inference
    try:
        # Extract features with feature extractor
        inputs = feature_extractor(
            inference_waveform,
            sampling_rate=TARGET_SAMPLE_RATE,
            return_tensors="pt",
            padding=True
        )

        input_values = inputs.input_values.to(device)
        attention_mask = inputs.get("attention_mask")
        if attention_mask is not None:
            attention_mask = attention_mask.to(device)

        with torch.no_grad():
            outputs = model(input_values, attention_mask=attention_mask)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()

        real_idx = label_map["real"]
        fake_idx = label_map["fake"]

        real_prob = float(probs[real_idx])
        fake_prob = float(probs[fake_idx])

        # Normalize probabilities sum to 1.0
        total_p = real_prob + fake_prob
        if total_p > 0:
            real_prob = real_prob / total_p
            fake_prob = fake_prob / total_p

        # Apply configurable decision policy
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
            f"{prediction} (Real: {real_prob:.4f}, Fake: {fake_prob:.4f})"
        )

        return DetectionResponse(
            prediction=prediction,
            real_probability=round(real_prob, 4),
            ai_generated_probability=round(fake_prob, 4),
            confidence_percent=confidence_percent,
            analyzed_duration_seconds=round(duration, 2),
            model=MODEL_NAME,
            notice=f"Experimental prediction, not proof of authenticity. Evaluated representative {int(MAX_ANALYSIS_SECONDS)}s speech segment." if duration > MAX_ANALYSIS_SECONDS else "Experimental prediction, not proof of authenticity. Confidence represents model statistical estimation."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error for '{filename}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during AI model inference: {str(e)}"
        )
