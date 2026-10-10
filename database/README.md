# TiDB Cloud Setup Guide

This project requires **TiDB Cloud (Serverless)**, a fully-managed, MySQL-compatible distributed SQL database with built-in TLS security.

---

## 1. Create a Free TiDB Cloud Serverless Cluster

1. Go to [https://tidbcloud.com/](https://tidbcloud.com/) and create a free account or sign in.
2. Click **Create Cluster**.
3. Choose **Serverless** (Free Tier).
4. Name your cluster (e.g., `voice-clone-db`) and select your closest cloud provider/region.
5. Click **Create**. Your cluster will be active within ~30 seconds.

---

## 2. Obtain Connection Details

1. In the cluster overview, click the **Connect** button in the top right.
2. Select **Connect with: General (or MySQL CLI / Java)**.
3. You will see:
   - **Host**: e.g., `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
   - **Port**: `4000`
   - **User**: e.g., `xxxxxx.root`
   - **Password**: Click **Generate Password** (save this securely).
   - **Database**: `voice_clone_detection`

---

## 3. Execute the Schema

You can execute the schema directly using the TiDB Cloud Web SQL Editor:

1. In TiDB Cloud Console, click **SQL Editor** in the left navigation bar.
2. Copy and paste the entire contents of [`database/schema.sql`](file:///c:/Users/SAHITHI/OneDrive/Documents/Desktop/AI-Voice-Clone-Detection-System/database/schema.sql).
3. Click **Run** to execute the script.
4. Verify that the tables `users` and `analysis_results` are created.

Alternatively, execute via MySQL command-line client:
```bash
mysql --connect-timeout=15 -u '<username>' -h <host> -P 4000 -D test --ssl-mode=VERIFY_IDENTITY --ssl-ca=<system-ca> -p < database/schema.sql
```

---

## 4. Environment Variables Configuration

Copy `.env.example` in `voice-clone-backend/` to `.env` or configure system environment variables:

```env
TIDB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_DATABASE=voice_clone_detection
TIDB_USERNAME=xxxxxx.root
TIDB_PASSWORD=your_tidb_password_here
```

### TiDB Cloud TLS Requirements
TiDB Cloud enforces TLS 1.2+ encryption. The Spring Boot application is pre-configured with:
```properties
spring.datasource.url=jdbc:mysql://${TIDB_HOST:localhost}:${TIDB_PORT:4000}/${TIDB_DATABASE:voice_clone_detection}?useSSL=true&requireSSL=true&verifyServerCertificate=true&enabledTLSProtocols=TLSv1.2,TLSv1.3
```
This guarantees enterprise-grade encrypted connections between the backend and TiDB Cloud.
