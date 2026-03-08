#!/bin/bash

echo "🏥 Starting MedhaOS Patient System"
echo "=================================="
echo ""

# Check if backend is running
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend already running on port 4000"
else
    echo "🚀 Starting Backend..."
    cd backend && npm start &
    sleep 5
fi

# Check if patient portal is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Patient Portal already running on port 3000"
else
    echo "🚀 Starting Patient Portal..."
    cd apps/patient-portal && npm start &
    sleep 10
fi

echo ""
echo "=================================="
echo "✅ MedhaOS Patient System is Ready!"
echo "=================================="
echo ""
echo "📱 Patient Portal: http://localhost:3000"
echo "🔧 Backend API:    http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
