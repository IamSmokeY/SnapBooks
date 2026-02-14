#!/bin/bash

# SnapBooks Python Backend Startup Script

echo "🚀 Starting SnapBooks Python Backend..."

# Navigate to BackEnd directory
cd "$(dirname "$0")/BackEnd" || exit 1

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet fastapi uvicorn python-dotenv httpx pydantic google-genai fpdf2 structlog firebase-admin

# Start server
echo ""
echo "✅ Dependencies installed"
echo "🌐 Starting server on http://localhost:8001"
echo "📡 API endpoints:"
echo "   - GET  /api/invoices"
echo "   - GET  /api/invoices/{id}"
echo "   - GET  /api/stats"
echo "   - GET  /api/health"
echo "   - POST /telegram/webhook"
echo ""

PORT=8001 python -m src.server.server
