# README for Developers - Run App in DEV MODE
## MongoDB
- Installation
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

- Setup DB: update admin and setup password
```bash
mongosh
> use admin
# admin DB full access to admin
> db.createUser({user:"admin",pwd:passwordPrompt(),roles:[{role:"userAdminAnyDatabase",db:"admin"}]})
# app DB full access to admin
> db.updateUser("admin",{roles:[{role:"readWrite",db:"app"}]})
> exit
sudo vim /etc/mongod.conf  # Add security:\n\tauthorization: enabled
sudo systemctl restart mongod
```

- Hash password for user `username`
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'<PASSWORD>', bcrypt.gensalt()).decode())"
```

- Connect to DB and with admin and add `<USERNAME>` user with the hash created
```bash
mongosh --port 27017 -u admin -p
> use app
app> db.users.insertOne({username: "<USERNAME>", password: "<BCRYPT-PASS-HASH>", role: "user", createdAt: new Date()})
app> db.users.createIndex({ username: 1 }, { unique: true })
```

## Backend
- Prepare environment 
```bash
cd app/backend
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

- Craft the .env file for environment var and secrets
```toml
MONGO_HOST="127.0.0.1"
MONGO_PORT=27017
MONGO_SECRET="<mongodb-user>:<mongodb-password>"
APP_SECRET_KEY=<app-secret>
# Via direct access
REACT_HOST_ORIGIN="http://localhost:3000"
# Via NGINX
REACT_HOST_ORIGIN="https://<FQDN>"
```

Replace all the `<>` with the values you set. For the APP_SECRET_KEY you can run this: `python3 -c "import secrets; print(secrets.token_hex())"`

- Run server
```bash
# Python
python3 run.py
# Gunicorn
gunicorn run:app
```

## Frontend


### Installations
- Craft frontend folder for the app
```bash
npx create-react-app frontend
cd frontend
```
- Install dependencies
```bash
npm install react-router-dom
npm install react-scripts --save  # If missing
npm install axios
npm audit fix  # If vuln errors
```
- Execute npm
```bash
REACT_APP_API_URL=http://localhost:8000/api npm start
```

# TESTS
## Login user - Via direct access
```bash
curl -X POST -k http://localhost:3000/login --data "username=XXX&password=XXX"
# Supposed to be 200
```

## Login user - Via DOCKERIZED setup
- Run docker, install curl and test login
```bash
docker exec -it backend /bin/bash
apt-get update && apt-get install -y curl
curl -X POST http://localhost:8000/api/login -d '{"username":"test","password":"test"}' -H "Content-Type: application/json"
```



