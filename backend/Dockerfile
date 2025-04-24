# backend/Dockerfile
# 1) Build stage: install deps
FROM python:3.8-slim AS builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Runtime stage
FROM python:3.8-slim
WORKDIR /app

# Copy installed packages from the builder
COPY --from=builder /usr/local/lib/python3.8/site-packages /usr/local/lib/python3.8/site-packages
COPY backend ./

# Expose the port your app listens on
EXPOSE 8000

# Launch FastAPI with uvicorn
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
