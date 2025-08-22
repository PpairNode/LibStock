# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Install static server and serve the built files
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3000"]
