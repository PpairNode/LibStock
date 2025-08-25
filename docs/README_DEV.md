# README
## RUN APP DEV MODE
### Database MONGODB
```bash
sudo systemctl start mongod
```

### Backend python3 Flask
- `.env` file
```bash
MONGO_HOST="127.0.0.1"
MONGO_PORT=27017
MONGO_SECRET="admin:admin"
# MONGO_URI -> Do not set this var as it is only used in production for DNS resolution with mongo
APP_SECRET_KEY=3d3f3fe087ec13c5b5213c8e2256e85acd61a50c7f521e01eab3a4e01d9c01a1
REACT_HOST_ORIGIN="http://localhost:3000"
```
- Execute python flask
```bash
# Python3
python3 run.py
```

### Frontend npm
- Frontend `.env` file
```bash
REACT_APP_API_URL=http://localhost:8000/api
```
- Execute npm
```bash
npm start
```

## TESTS
### Login user
```bash
curl -X POST -k https://127.0.0.1:5000/login --data "username=XXX&password=XXX"
# Supposed to be 200
```

### DOCKER and test login
- Run docker, install curl and test login
```bash
docker exec -it backend /bin/bash
apt-get update && apt-get install -y curl
curl -X POST http://localhost:8000/api/login -d '{"username":"test","password":"test"}' -H "Content-Type: application/json"
```

## Installations
### React Project
- Craft frontend folder for the app:
```bash
npx create-react-app frontend
cd frontend
```

