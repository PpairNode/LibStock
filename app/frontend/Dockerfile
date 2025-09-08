# frontend/Dockerfile
FROM node:20-alpine

ARG VITE_API_URL

WORKDIR /app
COPY . .
RUN npm install
RUN VITE_API_URL=$VITE_API_URL npm run build

# Install static server and serve the built files
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3000"]
