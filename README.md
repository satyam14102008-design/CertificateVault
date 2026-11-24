# CertificateVault

> **One place for every achievement.**  
> Personal digital certificate locker backed by React + Vite, FastAPI, MongoDB Atlas, Supabase Private Storage, and a Manifest V3 Chrome extension.

---

## Architecture

- **`frontend/`**: React 18, Vite, Tailwind CSS v3, React Router v6, Lucide React.
- **`backend/`**: Python FastAPI, Pydantic, PyMongo (`certificate_vault` DB), Argon2id + JWT auth, private Supabase Storage integration (`certificates` private bucket), Pytest suite.
- **`extension/`**: Chrome Manifest V3 extension (`activeTab`, `storage`) connecting to the same FastAPI backend and owner account.

---

## Local Development Setup

### 1. Backend
1. Configure `backend/.env` from [`backend/.env.example`](backend/.env.example) (`MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=certificates`).
2. Set your single private owner account locally (Argon2id hashed, never stored in plaintext):
   ```powershell
   backend\.venv\Scripts\python.exe backend\scripts\setup_owner.py
   ```
3. Verify MongoDB Atlas and Supabase Private Storage:
   ```powershell
   backend\.venv\Scripts\python.exe backend\scripts\verify_mongo.py
   backend\.venv\Scripts\python.exe backend\scripts\verify_storage.py
   ```
4. Run automated backend tests:
   ```powershell
   cd backend
   .venv\Scripts\pytest.exe -v
   ```
5. Start the FastAPI server:
   ```powershell
   backend\.venv\Scripts\uvicorn.exe app.main:app --app-dir backend --reload --port 8000
   ```
   Check health at `http://localhost:8000/api/health`.

### 2. Frontend
1. Ensure `frontend/.env` has `VITE_API_URL=http://localhost:8000`.
2. Start Vite:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.

### 3. Chrome Extension (Manifest V3)
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` folder.
4. Click the **CertificateVault** toolbar icon on any certificate page, sign in with your owner credentials, verify/edit the captured URL & title, optionally attach a local PDF/PNG/JPG, and click **Save Certificate**.

---

## Backup & Restoration

- **In-app export**: Go to **Settings → Storage & Backup** to download JSON or CSV metadata backups.
- **Full Vault Backup (MongoDB metadata + Supabase original files)**:
  ```powershell
  backend\.venv\Scripts\python.exe backend\scripts\backup_vault.py backup
  ```
  Creates `backups/backup-YYYYMMDD-HHMMSS/` containing `metadata.json` and `files/<cert_id>/<original_filename>`.
- **Restore from backup**:
  ```powershell
  backend\.venv\Scripts\python.exe backend\scripts\backup_vault.py restore --dir backups\backup-YYYYMMDD-HHMMSS
  ```
*(Note: Keep `backups/` outside version control or store encrypted copies offline.)*

---

## Production Deployment Checklist

1. **Backend (Render / Railway / Fly.io / VPS over HTTPS)**:
   - Use [`backend/.env.production.example`](backend/.env.production.example).
   - Set `FRONTEND_URL` to your deployed HTTPS frontend origin and `BACKEND_URL` to your HTTPS API URL.
   - Start without `--reload`: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - Restrict MongoDB Atlas Network Access to your backend host's egress IPs (or configure VPC peering).
2. **Frontend (Vercel / Netlify / Cloudflare Pages over HTTPS)**:
   - Set `VITE_API_URL` to your production HTTPS backend URL (`frontend/.env.production.example`).
   - Run `npm run build` and deploy `frontend/dist`.
3. **Chrome Extension (Production URL)**:
   - Update `DEFAULT_API_BASE_URL` and `DEFAULT_FRONTEND_URL` in `extension/api.js` and `host_permissions` in `extension/manifest.json` to your production HTTPS origins before packing.
