#!/bin/bash
# NexCal VPS Deployment Script

# Exit immediately if a command exits with a non-zero status
set -e

echo "📥 Pulling latest updates from Git..."
git pull origin main

echo "🐳 Building Docker image for NexCal app..."
docker compose build --no-cache app

echo "🚀 Starting containers in detached mode..."
docker compose up -d --remove-orphans

echo "✅ Deployment finished successfully!"
