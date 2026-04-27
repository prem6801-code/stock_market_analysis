# ───────────────────────────────────────────
# Stage 1 – Build the React frontend
# ───────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build
# produces /build/dist/


# ───────────────────────────────────────────
# Stage 2 – Python backend + static files
# ───────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

# Backend source code
COPY backend/ ./backend/

# Stock data CSV
COPY data/ ./data/

# React build output → /app/static  (FastAPI mounts this at "/")
COPY --from=frontend-builder /build/dist ./static/

# models/ is written at runtime; declare as a volume for persistence
RUN mkdir -p ./backend/models

EXPOSE 8000

WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]