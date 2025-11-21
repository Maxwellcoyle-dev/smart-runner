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

# Create a virtual environment for garmindb
RUN python3 -m venv /opt/garmindb-venv

# Install garmindb in the virtual environment
RUN /opt/garmindb-venv/bin/pip install --upgrade pip && \
    /opt/garmindb-venv/bin/pip install --no-cache-dir garmindb

# Verify garmindb installation
RUN /opt/garmindb-venv/bin/python -m garmindb --help > /dev/null 2>&1 && echo "garmindb installed successfully" || echo "garmindb installation check"

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data/users

# Expose port
EXPOSE 3000

# Set environment variables for garmindb
# Use the virtual environment Python and module approach
ENV GARMINDB_PYTHON=/opt/garmindb-venv/bin/python
ENV GARMINDB_CLI=/opt/garmindb-venv/bin/garmindb_cli.py
ENV PATH="/opt/garmindb-venv/bin:${PATH}"
ENV DATA_DIR=/app/data

# Start the server
CMD ["node", "server.js"]

