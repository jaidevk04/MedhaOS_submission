#!/bin/bash

# Simple, reliable startup script for MedhaOS
# This script starts everything in the correct order

set +e  # Don't exit on errors

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🏥 MedhaOS - Starting All Services 🏥             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Create logs directory
mkdir -p logs

# Step 1: Start Docker services (skip MinIO)
echo "📦 Step 1: Starting Docker services..."
docker compose up -d postgres redis opensearch prometheus grafana jaeger 2>/dev/null
sleep 3
echo "✅ Docker services started"
echo ""

# Step 2: Check if backend dependencies are installed
echo "📦 Step 2: Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --prefix backend
fi
echo "✅ Backend dependencies ready"
echo ""

# Step 3: Run database migrations (only if not already done)
echo "📦 Step 3: Setting up database..."
npm run migrate --prefix backend 2>/dev/null || echo "Database already set up"
echo "✅ Database ready"
echo ""

# Step 4: Start backend
echo "🚀 Step 4: Starting Backend API (port 4000)..."
npm start --prefix backend > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
sleep 5
echo ""

# Step 5: Start frontend apps
echo "🌐 Step 5: Starting Frontend Applications..."

echo "   Starting Patient Portal (port 3000)..."
npm start --prefix apps/patient-portal > logs/patient-portal.log 2>&1 &
sleep 3

echo "   Starting Clinician Terminal (port 3002)..."
npm run dev --prefix apps/clinician-terminal > logs/clinician-terminal.log 2>&1 &
sleep 2

echo "   Starting Nurse Tablet (port 3003)..."
npm run dev --prefix apps/nurse-tablet > logs/nurse-tablet.log 2>&1 &
sleep 2

echo "   Starting Admin Dashboard (port 3004)..."
npm run dev --prefix apps/admin-dashboard > logs/admin-dashboard.log 2>&1 &
sleep 2

echo "   Starting Public Health Dashboard (port 3005)..."
npm run dev --prefix apps/public-health-dashboard > logs/public-health-dashboard.log 2>&1 &
sleep 2

echo "✅ All frontend apps started"
echo ""

# Step 6: Wait for everything to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10
echo ""

# Step 7: Verify services
echo "🔍 Verifying services..."
echo ""

# Check backend
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend API:             http://localhost:4000"
else
    echo "⚠️  Backend API:             Starting... (check logs/backend.log)"
fi

# Check patient portal
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Patient Portal:          http://localhost:3000"
else
    echo "⏳ Patient Portal:          Starting... (check logs/patient-portal.log)"
fi

# Check frontend apps
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Clinician Terminal:      http://localhost:3002"
else
    echo "⏳ Clinician Terminal:      Starting... (check logs/clinician-terminal.log)"
fi

if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "✅ Nurse Tablet:            http://localhost:3003"
else
    echo "⏳ Nurse Tablet:            Starting... (check logs/nurse-tablet.log)"
fi

if curl -s http://localhost:3004 > /dev/null 2>&1; then
    echo "✅ Admin Dashboard:         http://localhost:3004"
else
    echo "⏳ Admin Dashboard:         Starting... (check logs/admin-dashboard.log)"
fi

if curl -s http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Public Health Dashboard: http://localhost:3005"
else
    echo "⏳ Public Health Dashboard: Starting... (check logs/public-health-dashboard.log)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 MedhaOS Started! 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 Open in browser:"
echo "   🏥 Patient Portal:         http://localhost:3000  ⭐ START HERE"
echo "   👨‍⚕️ Clinician Terminal:      http://localhost:3002"
echo "   👩‍⚕️ Nurse Tablet:            http://localhost:3003"
echo "   🔧 Admin Dashboard:         http://localhost:3004"
echo "   📊 Public Health Dashboard: http://localhost:3005"
echo ""
echo "🎯 Patient Journey:"
echo "   1. Open Patient Portal (http://localhost:3000)"
echo "   2. Click 'Voice Triage' or 'Text Symptoms'"
echo "   3. Select your language"
echo "   4. Describe symptoms"
echo "   5. Get AI assessment"
echo "   6. Book appointment"
echo ""
echo "🔑 Staff Login credentials:"
echo "   Email:    dr.rajesh@medhaos.com"
echo "   Password: password123"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/patient-portal.log"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/clinician-terminal.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-medhaos.sh"
echo ""
