# README

## Login user
```bash
curl -X POST -k https://127.0.0.1:5000/login --data "username=XXX&password=XXX"
# Supposed to be 200
```

## Install React Project
- Craft frontend folder for the app:
```bash
npx create-react-app frontend
cd frontend
```

# DOCKER
```bash
docker exec -it backend /bin/bash
apt-get update && apt-get install -y curl
curl -X POST http://127.0.0.1:8000/api/login -d '{"username":"test","password":"test"}' -H "Content-Type: application/json"
```