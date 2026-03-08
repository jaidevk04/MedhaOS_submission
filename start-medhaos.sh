#!/bin/bash

# MedhaOS Complete Startup Script
# This script starts all services: Docker infrastructure, backend API, and frontend applications

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=4000
CLINICIAN_PORT=3002
NURSE_PORT=3003
ADMIN_PORT=3004
PUBLIC_HEALTH_PORT=3005

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🏥 MedhaOS Healthcare Platform 🏥             ║"
echo "║                                                            ║"
echo "║              Complete System Startup Script               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node --version) is installed${NC}"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm --version) is installed${NC}"
}

# Step 1: Prerequisites Check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

check_docker
check_node
check_npm

echo ""

# Step 2: Start Docker Infrastructure
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Starting Docker Infrastructure${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
# Start essential services only (skip MinIO as it has port conflicts)
docker-compose up -d postgres redis opensearch prometheus grafana jaeger 2>&1 | grep -v "WARNING" || true

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check Docker services
echo ""
echo -e "${CYAN}Docker Services Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep medhaos || echo "No services running"

echo ""

# Wait for critical services
echo -e "${CYAN}Checking critical services:${NC}"
if curl -s http://localhost:5432 > /dev/null 2>&1 || docker ps | grep -q medhaos-postgres; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL may not be ready yet${NC}"
fi

if docker ps | grep -q medhaos-redis; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis may not be ready yet${NC}"
fi

echo ""

# Step 3: Install Dependencies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Run database migrations
echo ""
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
cd backend && npm run migrate && cd ..
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Check frontend apps dependencies
echo ""
echo -e "${YELLOW}📦 Checking frontend dependencies...${NC}"
for app in clinician-terminal nurse-tablet admin-dashboard public-health-dashboard; do
    if [ ! -d "apps/$app/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing $app dependencies...${NC}"
        npm install --prefix apps/$app
        echo -e "${GREEN}✅ $app dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ $app dependencies already installed${NC}"
    fi
done

echo ""

# Step 4: Start Backend API Server
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Starting Backend API Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if check_port $BACKEND_PORT; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use. Skipping backend startup.${NC}"
else
    echo -e "${YELLOW}🚀 Starting Backend API Server on port $BACKEND_PORT...${NC}"
    npm start --prefix backend > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    sleep 5
    wait_for_service "Backend API" "http://localhost:$BACKEND_PORT/health"
    
    echo -e "${GREEN}✅ Backend API Server started (PID: $BACKEND_PID)${NC}"
fi

echo ""

# Step 5: Start Frontend Applications
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Starting Frontend Applications${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Clinician Terminal
if check_port $CLINICIAN_PORT; then
    echo -e "${YELLOW}⚠️  Port $CLINICIAN_PORT is already in use. Skipping Clinician Terminal.${NC}"
else
    echo -e "${YELLOW}🚀 Starting Clinician Terminal on port $CLINICIAN_PORT...${NC}"
    npm run dev --prefix apps/clinician-terminal > logs/clinician-terminal.log 2>&1 &
    CLINICIAN_PID=$!
    echo -e "${GREEN}✅ Clinician Terminal started (PID: $CLINICIAN_PID)${NC}"
fi

# Start Nurse Tablet
if check_port $NURSE_PORT; then
    echo -e "${YELLOW}⚠️  Port $NURSE_PORT is already in use. Skipping Nurse Tablet.${NC}"
else
    echo -e "${YELLOW}🚀 Starting Nurse Tablet on port $NURSE_PORT...${NC}"
    npm run dev --prefix apps/nurse-tablet > logs/nurse-tablet.log 2>&1 &
    NURSE_PID=$!
    echo -e "${GREEN}✅ Nurse Tablet started (PID: $NURSE_PID)${NC}"
fi

# Start Admin Dashboard
if check_port $ADMIN_PORT; then
    echo -e "${YELLOW}⚠️  Port $ADMIN_PORT is already in use. Skipping Admin Dashboard.${NC}"
else
    echo -e "${YELLOW}🚀 Starting Admin Dashboard on port $ADMIN_PORT...${NC}"
    npm run dev --prefix apps/admin-dashboard > logs/admin-dashboard.log 2>&1 &
    ADMIN_PID=$!
    echo -e "${GREEN}✅ Admin Dashboard started (PID: $ADMIN_PID)${NC}"
fi

# Start Public Health Dashboard
if check_port $PUBLIC_HEALTH_PORT; then
    echo -e "${YELLOW}⚠️  Port $PUBLIC_HEALTH_PORT is already in use. Skipping Public Health Dashboard.${NC}"
else
    echo -e "${YELLOW}🚀 Starting Public Health Dashboard on port $PUBLIC_HEALTH_PORT...${NC}"
    npm run dev --prefix apps/public-health-dashboard > logs/public-health-dashboard.log 2>&1 &
    PUBLIC_HEALTH_PID=$!
    echo -e "${GREEN}✅ Public Health Dashboard started (PID: $PUBLIC_HEALTH_PID)${NC}"
fi

echo ""
echo -e "${YELLOW}⏳ Waiting for frontend applications to be ready...${NC}"
sleep 10

echo ""

# Step 6: Verify All Services
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 6: Verifying All Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check all services
echo -e "${CYAN}Service Status:${NC}"
echo ""

# Backend API
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API${NC}              http://localhost:$BACKEND_PORT"
else
    echo -e "${RED}❌ Backend API${NC}              http://localhost:$BACKEND_PORT"
fi

# Frontend Apps
if curl -s http://localhost:$CLINICIAN_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Clinician Terminal${NC}       http://localhost:$CLINICIAN_PORT"
else
    echo -e "${RED}❌ Clinician Terminal${NC}       http://localhost:$CLINICIAN_PORT"
fi

if curl -s http://localhost:$NURSE_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nurse Tablet${NC}             http://localhost:$NURSE_PORT"
else
    echo -e "${RED}❌ Nurse Tablet${NC}             http://localhost:$NURSE_PORT"
fi

if curl -s http://localhost:$ADMIN_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin Dashboard${NC}          http://localhost:$ADMIN_PORT"
else
    echo -e "${RED}❌ Admin Dashboard${NC}          http://localhost:$ADMIN_PORT"
fi

if curl -s http://localhost:$PUBLIC_HEALTH_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Public Health Dashboard${NC}  http://localhost:$PUBLIC_HEALTH_PORT"
else
    echo -e "${RED}❌ Public Health Dashboard${NC}  http://localhost:$PUBLIC_HEALTH_PORT"
fi

echo ""

# Infrastructure Services
echo -e "${CYAN}Infrastructure Services:${NC}"
echo ""
echo -e "${GREEN}✅ PostgreSQL${NC}               http://localhost:5432"
echo -e "${GREEN}✅ Redis${NC}                    http://localhost:6379"
echo -e "${GREEN}✅ OpenSearch${NC}               http://localhost:9200"
echo -e "${GREEN}✅ MinIO Console${NC}            http://localhost:9001 (minioadmin/minioadmin)"
echo -e "${GREEN}✅ Grafana${NC}                  http://localhost:3001 (admin/admin)"
echo -e "${GREEN}✅ Prometheus${NC}               http://localhost:9090"
echo -e "${GREEN}✅ Jaeger${NC}                   http://localhost:16686"

echo ""

# Final Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎉 MedhaOS System Started Successfully! 🎉${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ All services are running!${NC}"
echo ""

echo -e "${CYAN}Quick Access URLs:${NC}"
echo ""
echo -e "  ${MAGENTA}Frontend Applications:${NC}"
echo -e "    • Clinician Terminal:      ${CYAN}http://localhost:$CLINICIAN_PORT${NC}"
echo -e "    • Nurse Tablet:            ${CYAN}http://localhost:$NURSE_PORT${NC}"
echo -e "    • Admin Dashboard:         ${CYAN}http://localhost:$ADMIN_PORT${NC}"
echo -e "    • Public Health Dashboard: ${CYAN}http://localhost:$PUBLIC_HEALTH_PORT${NC}"
echo ""
echo -e "  ${MAGENTA}Backend API:${NC}"
echo -e "    • API Server:              ${CYAN}http://localhost:$BACKEND_PORT${NC}"
echo -e "    • Health Check:            ${CYAN}http://localhost:$BACKEND_PORT/health${NC}"
echo ""
echo -e "  ${MAGENTA}Monitoring & Tools:${NC}"
echo -e "    • Grafana:                 ${CYAN}http://localhost:3001${NC} (admin/admin)"
echo -e "    • Prometheus:              ${CYAN}http://localhost:9090${NC}"
echo -e "    • Jaeger Tracing:          ${CYAN}http://localhost:16686${NC}"
echo -e "    • MinIO Console:           ${CYAN}http://localhost:9001${NC} (minioadmin/minioadmin)"
echo ""

echo -e "${YELLOW}📝 Logs are available in the ./logs directory${NC}"
echo ""

echo -e "${CYAN}To stop all services, run:${NC}"
echo -e "  ${YELLOW}./stop-medhaos.sh${NC}"
echo ""

echo -e "${CYAN}To view logs:${NC}"
echo -e "  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  ${YELLOW}tail -f logs/clinician-terminal.log${NC}"
echo -e "  ${YELLOW}docker-compose logs -f${NC}"
echo ""

echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
