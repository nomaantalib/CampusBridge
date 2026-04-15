FROM node:20-alpine

WORKDIR /app

# Install deps first (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/server.js"]
