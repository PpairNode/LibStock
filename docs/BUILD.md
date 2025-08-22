# DOCKER BUILD
## Environment file
- File `.env`
```bash
# Backend Setup
MONGO_HOST="mongo"
MONGO_PORT=27017
MONGO_SECRET="<DB-USERNAME>:<DB-PASSWORD>"
APP_SECRET_KEY=<APP-SECRET-KEY>  # Can be generated with `python3 -c "import secrets; print(secrets.token_hex())"` 
REACT_HOST_ORIGIN="https://localhost"

# DB Setup
MONGO_ADMIN_USER=<DB-USERNAME>
MONGO_ADMIN_PASS=<DB-PASSWORD>
USERNAME=<USER-OF-WEBSITE-NAME>
BCRYPT_PASSWORD_HASH=<USER-OF-WEBSITE-BCRYPT-PASSWORD-HASH>  # Can be generated with `python3 -c "import bcrypt; print(bcrypt.hashpw(b'<INSERT-PASS>', bcrypt.gensalt()).decode())"`

# Frontend Setup
REACT_APP_API_URL=https://localhost/api
```

## Run
```bash
docker-compose up --build
# Then open a browser and type https://localhost
```


# BACKEND
## MongoDB
### Installation
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

### Setup DB
- Update admin and setup password
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

- Hash password for user `test`
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'test', bcrypt.gensalt()).decode())"
```

- Connect to DB and with admin and add `test` user with the hash created
```bash
mongosh --port 27017 -u admin -p
> use app
app> db.users.insertOne({username: "test", password: "<BCRYPT-PASS-HASH>", role: "user", createdAt: new Date()})
app> db.users.createIndex({ username: 1 }, { unique: true })
```


## Flask Installation
```bash
cd app/backend
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

### Environment and mandatory values 
- Craft the .env file for environment var and secrets
```toml
MONGO_HOST="127.0.0.1"
MONGO_PORT=27017
MONGO_SECRET="<mongodb-user>:<mongodb-password>"
APP_SECRET_KEY=<app-secret>
REACT_HOST_ORIGIN="https://localhost:3000"
```

Replace all the `<>` with the values you set. For the APP_SECRET_KEY you can run this: `python3 -c "import secrets; print(secrets.token_hex())"`

## Run Flask server
- Python3
```bash
python3 run.py
```

- Gunicorn
```bash
gunicorn run:app
```

# FRONTEND
## Install dependencies:
```bash
npm install react-router-dom
npm install react-scripts --save  # If missing
npm install axios
npm audit fix  # If vuln errors
```

## Start frontend server
```bash
HTTPS=true npm start
```

# TEST Login
```bash
curl -X POST -k http://127.0.0.1:8000/login -H "Content-Type: application/json" --data '{"username":"<USER>","password":"<PASSWORD>"}'
{"message":"Login successful","redirect":"/dashboard"}
```
