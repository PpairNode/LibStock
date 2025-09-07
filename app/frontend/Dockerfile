# frontend/Dockerfile
FROM node:20-alpine

ARG REACT_APP_API_URL

WORKDIR /app
COPY . .
RUN npm install
RUN REACT_APP_API_URL=$REACT_APP_API_URL npm run build

# Install static server and serve the built files
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3000"]
