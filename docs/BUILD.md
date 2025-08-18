# Build APP
## Create certificates
```bash
mkdir tls
openssl req -x509 -newkey rsa:4096 -keyout tls/key.pem -out tls/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

## Installation MongoDB
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

## Install React Project
```bash
npx create-react-app frontend
cd frontend
npm install react-router-dom
npm audit fix  # If vuln errors
npm install react-scripts --save  # If missing
npm install axios
```

## Start frontend server
```bash
HTTPS=true npm start
```

### Connect with mongod
```bash
mongosh
> use admin
# admin DB full access to admin
> db.createUser({user:"admin",pwd:passwordPrompt(),roles:[{role:"userAdminAnyDatabase",db:"admin"}]})
# app DB full access to admin
> db.updateUser("admin",{roles:[{role:"readWrite",db:"app"}]})
> exit
sudo vim /etc/mongod.conf  # Add security:\n\tauthorization: enabled
sudo systemclt restart mongod
mongosh --port 27017 -u admin -p
> use app
app> db.users.insertOne({username: "test", password: "<BCRYPT-PASS-HASH>", role: "user", createdAt: new Date()})
app> db.users.createIndex({ username: 1 }, { unique: true })
```

Hash password with bcrypt
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'test', bcrypt.gensalt()).decode())"
```

## Installation
```bash
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

