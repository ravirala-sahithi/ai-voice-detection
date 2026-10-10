import io
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
from app import app, load_ai_model

def run_tests():
    print("=== Testing FastAPI AI Service ===")
    # Ensure model is initialized
    load_ai_model()

    client = TestClient(app)

    # Test 1: GET /
    res_root = client.get("/")
    print("1. GET / status:", res_root.status_code)
    assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
    print("   Response:", res_root.json())

    # Test 2: GET /health
    res_health = client.get("/health")
    print("2. GET /health status:", res_health.status_code)
    assert res_health.status_code == 200
    health_data = res_health.json()
    print("   Health Data:", health_data)
    assert health_data["model_loaded"] is True, "Model should be reported as loaded"

    # Test 3: POST /detect with empty file
    res_empty = client.post("/detect", files={"file": ("empty.wav", b"", "audio/wav")})
    print("3. Empty file rejection status:", res_empty.status_code)
    assert res_empty.status_code == 400

    # Test 4: POST /detect with invalid file extension
    res_invalid_ext = client.post("/detect", files={"file": ("virus.exe", b"malicious", "application/octet-stream")})
    print("4. Invalid extension rejection status:", res_invalid_ext.status_code)
    assert res_invalid_ext.status_code == 400

    # Test 5: POST /detect with valid synthetic audio
    # Create 1.5 seconds of multi-tone speech-like synthetic audio
    sr = 16000
    t = np.linspace(0, 1.5, int(sr * 1.5), endpoint=False)
    # Harmonics roughly modeling vocal formants
    synth_voice = (
        0.4 * np.sin(2 * np.pi * 220 * t) +
        0.3 * np.sin(2 * np.pi * 440 * t) +
        0.2 * np.sin(2 * np.pi * 880 * t) +
        0.1 * np.random.normal(0, 0.05, len(t))
    ).astype(np.float32)

    buf = io.BytesIO()
    sf.write(buf, synth_voice, sr, format="WAV")
    buf.seek(0)
    audio_bytes = buf.read()

    res_detect = client.post(
        "/detect",
        files={"file": ("speech_sample.wav", audio_bytes, "audio/wav")}
    )
    print("5. POST /detect status:", res_detect.status_code)
    assert res_detect.status_code == 200, f"Expected 200, got {res_detect.status_code}: {res_detect.text}"
    detect_data = res_detect.json()
    print("   Detection Result:")
    for k, v in detect_data.items():
        print(f"     {k}: {v}")

    assert "prediction" in detect_data
    assert detect_data["prediction"] in ["LIKELY_REAL", "AI_GENERATED", "INCONCLUSIVE"]
    assert "real_probability" in detect_data
    assert "ai_generated_probability" in detect_data
    assert "confidence_percent" in detect_data
    assert "analyzed_duration_seconds" in detect_data

    print("\n ALL AI SERVICE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
