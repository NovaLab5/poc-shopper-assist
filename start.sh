#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎁 POC SweetDill AI Assistant${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❗ Please edit .env and add your API keys before continuing!${NC}"
    echo ""
    echo -e "${YELLOW}Required API Keys:${NC}"
    echo -e "  1. Google Gemini API Key: ${BLUE}https://aistudio.google.com/app/apikey${NC}"
    echo -e "  2. Google Cloud TTS API Key: ${BLUE}https://console.cloud.google.com/apis/credentials${NC}"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if API keys are set
if grep -q "your_google_gemini_api_key_here" .env || grep -q "your_google_cloud_tts_api_key_here" .env; then
    echo -e "${RED}❌ API keys not configured in .env file${NC}"
    echo -e "${YELLOW}Please edit .env and add your API keys:${NC}"
    echo -e "  1. Google Gemini API Key: ${BLUE}https://aistudio.google.com/app/apikey${NC}"
    echo -e "  2. Google Cloud TTS API Key: ${BLUE}https://console.cloud.google.com/apis/credentials${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ API keys configured${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Start services
echo -e "${GREEN}🐳 Starting Docker services...${NC}"
echo ""
echo -e "${BLUE}Services starting:${NC}"
echo -e "  📦 MongoDB on ${GREEN}localhost:27017${NC}"
echo -e "  🚀 Backend API on ${GREEN}http://localhost:3001${NC}"
echo -e "  🎨 Frontend on ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

docker-compose up --build

