#!/bin/bash

# MedhaOS Complete Shutdown Script
# This script stops all services: Frontend applications, backend API, and Docker infrastructure

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🏥 MedhaOS Healthcare Platform 🏥             ║"
echo "║                                                            ║"
echo "║              Complete System Shutdown Script              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Configuration
BACKEND_PORT=4000
PATIENT_PORTAL_PORT=3000
CLINICIAN_PORT=3002
NURSE_PORT=3003
ADMIN_PORT=3004
PUBLIC_HEALTH_PORT=3005

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}🛑 Stopping $name (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null || true
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  $name is not running${NC}"
    fi
}

# Step 1: Stop Frontend Applications
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Stopping Frontend Applications${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

kill_port $PATIENT_PORTAL_PORT "Patient Portal"
kill_port $CLINICIAN_PORT "Clinician Terminal"
kill_port $NURSE_PORT "Nurse Tablet"
kill_port $ADMIN_PORT "Admin Dashboard"
kill_port $PUBLIC_HEALTH_PORT "Public Health Dashboard"

echo ""

# Step 2: Stop Backend API Server
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Stopping Backend API Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

kill_port $BACKEND_PORT "Backend API Server"

echo ""

# Step 3: Stop Docker Infrastructure
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Stopping Docker Infrastructure${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}🐳 Stopping Docker services...${NC}"
docker compose down

echo -e "${GREEN}✅ Docker services stopped${NC}"

echo ""

# Step 4: Clean up logs (optional)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Cleanup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Do you want to clean up log files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "logs" ]; then
        echo -e "${YELLOW}🧹 Cleaning up logs...${NC}"
        rm -rf logs/*.log
        echo -e "${GREEN}✅ Logs cleaned${NC}"
    fi
fi

echo ""

# Final Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✅ MedhaOS System Stopped Successfully! ✅${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}All services have been stopped.${NC}"
echo ""

echo -e "${CYAN}To start the system again, run:${NC}"
echo -e "  ${YELLOW}./start-medhaos.sh${NC}"
echo ""

echo -e "${GREEN}Goodbye! 👋${NC}"
echo ""
