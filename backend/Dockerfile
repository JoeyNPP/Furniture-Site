# /root/NPP_Deals/backend/Dockerfile

FROM python:3.8-slim
WORKDIR /app

# 1) Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copy application code
COPY backend ./

# 3) Expose and run
EXPOSE 8000
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
