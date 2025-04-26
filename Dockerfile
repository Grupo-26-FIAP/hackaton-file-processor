# Dockerfile

FROM node:23-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Use production .env (optional)
# COPY .env.production .env

# Expose port (in case of testing HTTP)
EXPOSE 3002

# Start the app
CMD ["npm", "run", "start:prod"]
