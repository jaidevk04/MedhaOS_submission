#!/bin/bash

# Quick Start Script - Starts everything without MinIO

echo "🏥 Starting MedhaOS..."
echo ""

# Start essential Docker services only
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis opensearch prometheus grafana jaeger 2>/dev/null
sleep 3

# Start backend
echo "🚀 Starting Backend API..."
npm start --prefix backend > logs/backend.log 2>&1 &
sleep 5

# Start frontend apps
echo "🌐 Starting Frontend Apps..."
npm run dev --prefix apps/clinician-terminal > logs/clinician.log 2>&1 &
npm run dev --prefix apps/nurse-tablet > logs/nurse.log 2>&1 &
npm run dev --prefix apps/admin-dashboard > logs/admin.log 2>&1 &
npm run dev --prefix apps/public-health-dashboard > logs/public-health.log 2>&1 &

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "✅ MedhaOS Started!"
echo ""
echo "📱 Access URLs:"
echo "   • Clinician Terminal:      http://localhost:3002"
echo "   • Nurse Tablet:            http://localhost:3003"
echo "   • Admin Dashboard:         http://localhost:3004"
echo "   • Public Health Dashboard: http://localhost:3005"
echo "   • Backend API:             http://localhost:4000"
echo ""
echo "🔑 Login: dr.rajesh@medhaos.com / password123"
echo ""
echo "📝 View logs: tail -f logs/backend.log"
echo ""
