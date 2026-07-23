# AI Model Service — Python/FastAPI
FROM python:3.12-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (including sibling modules)
COPY . .

# Set Python path to include ai/ root for orchestration, agents, etc.
ENV PYTHONPATH=/app

EXPOSE 4004
CMD ["python", "main.py"]
