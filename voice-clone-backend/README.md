# Voice Clone Detection Backend (Spring Boot + TiDB Cloud)

Robust Spring Boot REST API for managing users, securing audio analysis transactions, communicating with the AI microservice, and persisting deepfake voice classification results in **TiDB Cloud**.

---

## 1. Architecture & Security Features
- **Java 17 & Spring Boot 3.3.4**
- **Stateless JWT Authentication**: Secure HMAC-SHA256 tokens with configurable expiration.
- **BCrypt Password Hashing**: Passwords stored salted and hashed.
- **User Data Isolation**: Strict relational queries ensuring users can only view and manage their own detection records.
- **TiDB Cloud TLS Security**: Enforced TLS v1.2/v1.3 connection using the official MySQL JDBC Connector.
- **Multipart Audio Forwarding**: Streams audio payloads with timeout resilience to the Python FastAPI microservice.

---

## 2. API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes (`Bearer <token>`) |

### Voice Detection & History (`/api/voice`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/voice/analyze` | Upload audio for detection (`file` field) | Yes |
| `GET` | `/api/voice/result/{id}` | Retrieve individual analysis record | Yes |
| `GET` | `/api/voice/history` | Retrieve current user's analysis history | Yes |
| `DELETE` | `/api/voice/history/{id}` | Delete analysis record from TiDB | Yes |
| `GET` | `/api/voice/dashboard` | Retrieve statistics (total, real, fake) | Yes |

---

## 3. Configuration & Run (Windows)

1. Set up your TiDB Cloud cluster and copy connection details into environment variables (or `.env` file):
   ```powershell
   $env:TIDB_HOST="your-tidb-host.aws.tidbcloud.com"
   $env:TIDB_PORT="4000"
   $env:TIDB_DATABASE="voice_clone_detection"
   $env:TIDB_USERNAME="your-user.root"
   $env:TIDB_PASSWORD="your-cluster-password"
   ```

2. Compile and run test suite:
   ```powershell
   mvn clean test
   ```

3. Launch Spring Boot application on port `8081`:
   ```powershell
   mvn spring-boot:run
   ```
