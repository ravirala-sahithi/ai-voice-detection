# AI Voice Clone Detection System — React Frontend

Modern, high-performance web interface built with React 18, Vite, and Axios for analyzing speech recordings and viewing deepfake detection telemetry.

---

## 1. Key Pages & Features

1. **Landing Page (`/`)**: Product showcase, model capabilities, and architecture overview.
2. **Authentication (`/login`, `/register`)**: JWT login and account registration with form validation and BCrypt integration.
3. **Dashboard (`/dashboard`)**: Summary cards (Total Analyzed, Likely Real, AI-Generated, Inconclusive), quick action button, and recent analyses table.
4. **Audio Detection (`/detect`)**:
   - Drag-and-drop audio uploader (WAV, MP3, FLAC, OGG, M4A up to 20MB).
   - Audio playback preview with seekable waveform tracking.
   - Replace/remove file controls.
   - Multi-stage pipeline progress indicator.
5. **Analysis Result (`/result/:id`)**:
   - Classification badge (`LIKELY_REAL`, `AI_GENERATED`, `INCONCLUSIVE`).
   - Confidence percentage gauge and dual probability distribution bars.
   - Technical metadata (duration, model identifier, analysis timestamp).
   - Research disclaimer notice.
6. **Analysis History (`/history`)**: Search by filename, filter by classification, sort, view detail reports, and delete individual records.
7. **Profile & Security (`/profile`)**: User information, cryptographic security overview (BCrypt, HMAC-SHA256, TiDB TLS 1.2+), and logout.

---

## 2. Running Locally (Windows)

1. Install dependencies:
   ```powershell
   npm.cmd install
   ```

2. Start the Vite development server on port `5173`:
   ```powershell
   npm.cmd run dev
   ```

3. Open in browser: `http://localhost:5173`
