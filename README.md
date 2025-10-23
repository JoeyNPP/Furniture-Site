# NPP Deals Modernisation

NPP Deals is an upgraded platform that blends a FastAPI backend, a React SPA frontend, and a PostgreSQL database. The project targets two primary environments:

- **Droplet (production-like)**: `/root/NPP_Deals` on DigitalOcean VM `104.131.49.141` (Docker Compose stack).
- **Local development (Windows)**: `C:\Users\josep\projects\NPP_Deals` (Docker Desktop / WSL2).

---

## Repository Layout
```
backend/      FastAPI services, SQLAlchemy models, Alembic migrations
frontend/     React application, Vite tooling, client-side integrations
scripts/      Operational helpers (imports, remote execution, maintenance)
config/       Container and infrastructure configuration
Dockerfile    Backend build image
docker-compose.yml Full stack orchestration (backend, frontend, Postgres, worker)
```

---

## Core Services
- **Backend**: FastAPI app exposed on `:8000`; health endpoint is `/`.
- **Frontend**: React app exposed on `:80` in Docker (`:3000` in local dev server).
- **Database**: PostgreSQL on `:5432` with database `npp_deals`.
- **Message/Worker**: Any supporting worker services are orchestrated through Docker Compose.

---

## Prerequisites
### Shared
- Python 3.10+
- Node.js 18.x and npm 10.x
- Docker Engine 28.x and Docker Compose V2
- Git

### Windows specifics
1. **WSL2** (required for Docker Desktop backend):
   ```powershell
   wsl --install
   wsl --set-default-version 2
   wsl --update
   ```
2. **Docker Desktop** (enable "Use the WSL 2 based engine").
3. Optional utilities: PowerShell 7+, curl, jq.

---

## Environment Configuration
### Droplet (`104.131.49.141`)
- Working directory: `/root/NPP_Deals`
- Python virtual environment: `/root/NPP_Deals/backend/.venv`
- Add `pyenv` shims for non-interactive shells by appending to `/root/.profile`:
  ```bash
  echo 'export PATH="/root/.pyenv/shims:/root/.pyenv/bin:$PATH"' >> /root/.profile
  ```
  Use `.profile` for automation and keep `.bashrc` for interactive shells.

### Local Windows workstation
- Working directory: `C:\Users\josep\projects\NPP_Deals`
- Copy environment templates after cloning:
  ```powershell
  Copy-Item backend\.env backend\.env.local -ErrorAction SilentlyContinue
  Copy-Item frontend\.env frontend\.env.local -ErrorAction SilentlyContinue
  ```
- Update secrets in `.env.local` files as needed (see Credentials below).

---

## Setup & Verification
### Droplet checklist
1. SSH into the host and source profile:
   ```bash
   ssh root@104.131.49.141
   source ~/.profile
   ```
2. Confirm toolchain:
   ```bash
   pyenv --version
   python --version
   pip --version
   node --version
   npm --version
   df -h /dev/vda1
   ```
3. Ensure services are up:
   ```bash
   cd /root/NPP_Deals
   docker compose up -d
   docker compose ps
   curl http://localhost:8000/
   ```
4. Generate a JWT (see Authentication below) and validate protected routes.
5. Inspect data via `docker exec -it npp_deals_npp_deals-db-1 psql -U postgres -d npp_deals`.

### Local development checklist
1. Clone or update the repo:
   ```powershell
   git clone https://github.com/JoeyNPP/NPP_Deals.git C:\Users\josep\projects\NPP_Deals
   cd C:\Users\josep\projects\NPP_Deals
   git pull --ff-only
   ```
2. Verify tooling:
   ```powershell
   docker --version
   docker compose version
   node --version
   npm --version
   python --version
   wsl --version
   ```
3. Start Docker Desktop and wait for the green "Running" status.
4. Install dependencies:
   ```powershell
   npm --prefix frontend install
   pip install -r backend/requirements.txt
   ```
5. Bring up the stack:
   ```powershell
   docker compose up --build
   ```
6. Validate services:
   ```powershell
   curl.exe http://localhost:8000/
   Start-Process http://localhost
   ```
7. (Optional) Run the React dev server separately: `npm --prefix frontend start`.

---

## Authentication & Data Checks
### Generate a JWT
- **Bash (Droplet/WSL)**
  ```bash
  curl -X POST http://localhost:8000/login \
       -H "Content-Type: application/json" \
       -d '{"username":"joey","password":"Winter2025$"}'
  ```
  *(Escape the dollar sign as `Winter2025\$` when using double-quoted JSON.)*

- **PowerShell (Windows)**
  ```powershell
  curl.exe -X POST http://localhost:8000/login `
      -H "Content-Type: application/json" `
      -d '{"username":"joey","password":"Winter2025$"}'
  ```

Copy the `access_token` from the JSON response.

### Verify products API
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/products
```

### Inspect database
```bash
docker exec -it npp_deals_npp_deals-db-1 psql -U postgres -d npp_deals <<'SQL'
\dt
SELECT COUNT(*) FROM products;
SELECT username FROM users;
SQL
```

---

## Troubleshooting
- **Docker daemon not running**: Start Docker Desktop; if WSL integration fails, run `wsl --update` and restart.
- **Port conflicts**: Identify processes with
  ```powershell
  netstat -a -n -o | Select-String "80" | Select-String "LISTEN"
  netstat -a -n -o | Select-String "8000"
  netstat -a -n -o | Select-String "5432"
  ```
  Terminate with `Stop-Process -Id <PID>` (PowerShell) or `taskkill /PID <PID> /F` (cmd) before re-running compose.
- **Firewall blocks**: Allow traffic explicitly:
  ```powershell
  netsh advfirewall firewall add rule name="NPP_Deals_Backend" dir=in action=allow protocol=TCP localport=8000
  netsh advfirewall firewall add rule name="NPP_Deals_DB" dir=in action=allow protocol=TCP localport=5432
  ```
- **Non-interactive shells miss pyenv**: Keep PATH config in `.profile` and reserve `.bashrc` for interactive prompts.

---

## Credentials & Secrets
- Backend login: `joey` / `Winter2025$`
- PostgreSQL: `postgres` / `26,Sheetpans!`
- SSH: `root@104.131.49.141` / `dont2025$Forget`

Store secrets securely; avoid committing overrides.

---

## Automation Helpers
A sample Paramiko script for remote checks lives in `scripts/remote_exec_paramiko.py`. Run it with Python 3.10+ to validate droplet services programmatically.

---

## Next Steps
- Populate `AGENTS.md` with current operators and responsibilities.
- Push documentation updates upstream after validation.
- Run frontend regression (inventory, broadcasts, CSV import) once services are healthy.
