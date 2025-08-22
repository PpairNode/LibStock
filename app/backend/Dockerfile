# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "--capture-output", "-b", "0.0.0.0:8000", "run:app", "--log-level", "debug"]
