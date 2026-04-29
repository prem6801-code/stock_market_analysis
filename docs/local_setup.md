# Local Setup Guide

## Prerequisites

| Requirement | Minimum Version | Check |
|---|---|---|
| Python | 3.9+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | any | `git --version` |

> **Note:** Python 3.10+ is recommended. If you are on 3.9, the app is compatible but Docker uses 3.11.

---

## Project Structure

```
stock_market_analysis/
├── backend/               ← FastAPI application
│   ├── main.py
│   ├── requirements.txt
│   ├── constants.py
│   ├── services/
│   │   ├── data_service.py
│   │   ├── model_service.py
│   │   └── pipeline_service.py
│   ├── routers/
│   │   ├── stocks.py
│   │   ├── predictions.py
│   │   ├── analytics.py
│   │   └── pipeline.py
│   ├── models/            ← auto-created; stores trained .joblib files
│   └── notebooks/         ← EDA and XGBoost notebooks
├── frontend/              ← React application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── api/
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── stocks_data.csv    ← 5-year NSE stock data
├── docs/                  ← this folder
└── Dockerfile
```

---

## Option A — Run Locally (Development)

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd stock_market_analysis
```

### Step 2 — Set up the Python backend

```bash
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Start the backend server

```bash
# From inside backend/ with venv active
uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

> **First startup note:** If `backend/models/` is empty, the server will train XGBoost models for all 5 stocks before becoming ready. This takes approximately 1–2 minutes. You will see `Training model for <symbol>...` in the logs.

The backend API is now available at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

### Step 4 — Set up the React frontend

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Expected output:
```
  VITE v5.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

> The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:8000`, so no CORS or URL configuration is needed.

---

## Option B — Run with Docker

### Prerequisites
- Docker Desktop installed and running

### Build and run

```bash
# From the project root (where Dockerfile lives)
docker build -t stock-dashboard .

# Run the container
docker run -p 8000:8000 stock-dashboard
```

Open **http://localhost:8000** — FastAPI serves both the API and the React frontend.

### Persist trained models between restarts

```bash
docker run -p 8000:8000 \
  -v $(pwd)/backend/models:/app/backend/models \
  stock-dashboard
```

This mounts your local `backend/models/` directory into the container. Models trained during the first run are saved locally and reloaded on subsequent starts, skipping the ~2-minute training step.

### Stop the container

```bash
# Find container ID
docker ps

# Stop it
docker stop <container-id>
```

---

## Verifying the Setup

Once the application is running (either mode), verify each layer:

### 1 — Health check
```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok"}
```

### 2 — Stock data loaded
```bash
curl http://localhost:8000/api/stocks/
# Expected: {"stocks":["RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS"]}
```

### 3 — History endpoint
```bash
curl "http://localhost:8000/api/stocks/RELIANCE.NS/history?days=5"
# Expected: {"symbol":"RELIANCE.NS","data":[...5 rows with OHLCV and indicators...]}
```

### 4 — Predictions loaded
```bash
curl http://localhost:8000/api/predictions/all
# Expected: {"predictions":[{...5 stock forecasts...}]}
```

### 5 — Pipeline status
```bash
curl http://localhost:8000/api/pipeline/status
# Expected: {"last_run":null,"status":"never_run",...}
```

---

## Running the Notebooks

```bash
cd backend

# With venv active
pip install jupyter

# Launch Jupyter
jupyter notebook notebooks/
```

Open `eda.ipynb` first to generate `stocks_data.csv` and `processed_data.csv`, then open `xboost.ipynb` for model training.

> If `data/stocks_data.csv` already exists, skip the data fetching cell in `eda.ipynb` (it is marked as optional in the notebook).

---

## Common Issues

### Backend won't start — `ModuleNotFoundError`
```bash
# Make sure you are inside backend/ and the venv is active
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### `stocks_data.csv` not found
The file must exist at `data/stocks_data.csv` (project root level, not inside `backend/`).  
Either run the EDA notebook to generate it, or check that the `data/` folder is present.

### Port 8000 already in use
```bash
# macOS / Linux — find and kill the process
lsof -ti:8000 | xargs kill -9

# Or run on a different port
uvicorn main:app --reload --port 8001
```

### Frontend shows blank page / network errors
Make sure the backend is running on port 8000 before starting the frontend. The Vite proxy requires the backend to be reachable.

### Docker build fails on `npm install`
```bash
# Clean Docker build cache and retry
docker build --no-cache -t stock-dashboard .
```

### Yahoo Finance fetch fails (pipeline warning)
This is expected in cloud/Docker environments where Yahoo Finance blocks automated requests. The app will continue serving data from the CSV that was loaded at startup. See `docs/application.md` for details.
