# DOCKER BUILD
## Environment file
- File `.env`
```bash
# Backend Setup
MONGO_HOST="mongo"
MONGO_PORT=27017
MONGO_SECRET="<DB-USERNAME>:<DB-PASSWORD>"
APP_SECRET_KEY=<APP-SECRET-KEY>  # Can be generated with `python3 -c "import secrets; print(secrets.token_hex())"` 
REACT_HOST_ORIGIN="https://<FQDN>"

# DB Setup
MONGO_ADMIN_USER=<DB-USERNAME>
MONGO_ADMIN_PASS=<DB-PASSWORD>
USERNAME=<USER-OF-WEBSITE-NAME>
BCRYPT_PASSWORD_HASH=<USER-OF-WEBSITE-BCRYPT-PASSWORD-HASH>  # Can be generated with `python3 -c "import bcrypt; print(bcrypt.hashpw(b'<PASSWORD>', bcrypt.gensalt()).decode())"`

# Frontend Setup
REACT_APP_API_URL=https://FQDN/api
```

## Run
```bash
docker-compose up --build
# Then open a browser and type https://<FQDN>
```

## Clean and refresh
```bash
# Stop all containers
docker compose down --volumes --remove-orphans
# Remove all images built by docker-compose
docker image prune -af
# Remove all named volumes (if you really want to wipe persistent data like DB)
docker volume prune -f
# Rebuild and start fresh
docker compose up --build -d
```
