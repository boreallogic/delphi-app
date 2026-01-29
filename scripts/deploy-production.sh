#!/bin/bash

# Production Deployment Script for Delphi App
# This script prepares and deploys the application to production

set -e  # Exit on error

echo "========================================="
echo "Delphi App - Production Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production.local exists
if [ ! -f .env.production.local ]; then
    echo -e "${RED}Error: .env.production.local not found${NC}"
    echo "Please copy .env.production to .env.production.local and configure it"
    echo ""
    echo "  cp .env.production .env.production.local"
    echo "  nano .env.production.local"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Found .env.production.local"

# Source the production environment
export $(grep -v '^#' .env.production.local | xargs)

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASS"
)

MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}✗${NC} Missing required variable: $VAR"
        MISSING_VARS=1
    else
        echo -e "${GREEN}✓${NC} $VAR is set"
    fi
done

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Please configure .env.production.local with all required values"
    exit 1
fi

echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down

echo ""
echo -e "${YELLOW}Starting database...${NC}"
docker-compose up -d db

echo ""
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose --profile migrate up migrate

echo ""
echo -e "${YELLOW}Starting application...${NC}"
docker-compose up -d app

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Application is running at: $NEXTAUTH_URL"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f app"
echo ""
echo "To stop:"
echo "  docker-compose down"
echo ""
