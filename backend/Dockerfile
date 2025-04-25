# syntax=docker/dockerfile:1

### Builder stage: install dependencies ###
FROM python:3.8-slim AS builder
WORKDIR /app

# Copy requirements and install into the builder image
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

### Final stage: copy in both site-packages and CLI tools ###
FROM python:3.8-slim
WORKDIR /app

# Copy installed Python packages
COPY --from=builder /usr/local/lib/python3.8/site-packages /usr/local/lib/python3.8/site-packages

# Copy Python CLI tools (including uvicorn) that pip put into /usr/local/bin
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy your application code
COPY . .

# Default command: run uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
