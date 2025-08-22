#!/bin/bash
set -e

echo "Running MongoDB init script..."

mongosh <<EOF
use admin

db.createUser({
  user: "$MONGO_ADMIN_USER",
  pwd: "$MONGO_ADMIN_PASS",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWrite", db: "app" }
  ]
})

use app

db.users.insertOne({
  username: "$USERNAME",
  password: "$BCRYPT_PASSWORD_HASH",
  role: "user",
  createdAt: new Date()
})

db.users.createIndex({ username: 1 }, { unique: true })

EOF

echo "MongoDB initialization complete."
