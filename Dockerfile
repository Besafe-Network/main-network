# Use Debian-based Node 22 slim instead of Alpine
FROM node:22-bookworm-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files
COPY safety/package*.json ./

# Install all dependencies
RUN npm install

# Copy the application source code
COPY safety/ .

# Expose the port
EXPOSE 3674

ENV HOST=0.0.0.0
ENV PORT=3674

# Run the development script
CMD ["npm", "run", "dev"]
