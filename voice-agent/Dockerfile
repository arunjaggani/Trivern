FROM python:3.11-slim

WORKDIR /app

# System dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONUNBUFFERED=1

COPY . .

CMD ["python", "agent.py"]
