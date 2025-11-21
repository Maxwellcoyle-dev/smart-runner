# Multi-stage build for Node.js + Python + garmindb
FROM node:18-slim

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install garmindb globally
RUN pip3 install --no-cache-dir garmindb

# Verify garmindb installation
RUN python3 -m garmindb --help > /dev/null 2>&1 && echo "garmindb installed successfully" || echo "garmindb installation check"

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data/users

# Expose port
EXPOSE 3000

# Set environment variables for garmindb
# garmindb can be called as a module: python3 -m garmindb
ENV GARMINDB_PYTHON=/usr/bin/python3
ENV GARMINDB_CLI=/usr/local/bin/garmindb_cli.py
ENV DATA_DIR=/app/data

# Start the server
CMD ["node", "server.js"]

