#!/bin/bash

# MedhaOS API Endpoint Testing Script
# Tests which endpoints are actually implemented

API_BASE="http://localhost:4000"

echo "🏥 MedhaOS API Endpoint Testing"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
IMPLEMENTED=0
NOT_IMPLEMENTED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" 2>/dev/null)
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 201 ]; then
        echo -e "${GREEN}✅ IMPLEMENTED${NC}: $name ($endpoint)"
        IMPLEMENTED=$((IMPLEMENTED + 1))
        return 0
    elif [ "$status_code" -eq 404 ]; then
        echo -e "${RED}❌ NOT FOUND${NC}: $name ($endpoint)"
        NOT_IMPLEMENTED=$((NOT_IMPLEMENTED + 1))
        return 1
    else
        echo -e "${YELLOW}⚠️  STATUS $status_code${NC}: $name ($endpoint)"
        NOT_IMPLEMENTED=$((NOT_IMPLEMENTED + 1))
        return 1
    fi
}

echo "Testing Core API Endpoints..."
echo "--------------------------------"

# Basic endpoints
test_endpoint "Health Check" "/health"
test_endpoint "API Info" "/api"
test_endpoint "Patients List" "/api/patients"
test_endpoint "Alerts List" "/api/alerts"

echo ""
echo "📋 Requirement 1: Multilingual Patient Registration and Triage"
test_endpoint "Patient Registration" "/api/patients/register" "POST"
test_endpoint "Speech-to-Text" "/api/speech/transcribe" "POST"
test_endpoint "Triage Questions" "/api/triage/questions"
test_endpoint "Urgency Scoring" "/api/triage/score" "POST"
test_endpoint "ABHA Integration" "/api/abdm/patient"
test_endpoint "Language Support" "/api/languages"

echo ""
echo "📅 Requirement 2: Intelligent Appointment Scheduling"
test_endpoint "Facility Search" "/api/facilities/search"
test_endpoint "Appointment Booking" "/api/appointments/book" "POST"
test_endpoint "Queue Status" "/api/queue/status"
test_endpoint "Wait Time Estimation" "/api/queue/wait-time"
test_endpoint "Appointments List" "/api/appointments"

echo ""
echo "🎙️ Requirement 3: Ambient Clinical Documentation"
test_endpoint "Start Recording" "/api/scribe/start" "POST"
test_endpoint "Real-time Transcription" "/api/scribe/transcribe" "POST"
test_endpoint "Extract Clinical Facts" "/api/scribe/extract-facts" "POST"
test_endpoint "Generate SOAP Notes" "/api/scribe/generate-soap" "POST"
test_endpoint "Clinical Notes" "/api/clinical-notes"

echo ""
echo "💊 Requirement 4: Clinical Decision Support and Drug Safety"
test_endpoint "Drug Interaction Check" "/api/drugs/check-interactions" "POST"
test_endpoint "Allergy Check" "/api/drugs/check-allergies" "POST"
test_endpoint "Drug Inventory" "/api/drugs/inventory"
test_endpoint "Drug Search" "/api/drugs/search"

echo ""
echo "🔬 Requirement 5: Medical Image Analysis"
test_endpoint "Upload Medical Image" "/api/imaging/upload" "POST"
test_endpoint "Analyze Image" "/api/imaging/analyze" "POST"
test_endpoint "Get Radiology Report" "/api/imaging/report"
test_endpoint "Images List" "/api/imaging"

echo ""
echo "🛏️ Requirement 6: Bed Occupancy and Capacity Management"
test_endpoint "Bed Availability" "/api/capacity/beds"
test_endpoint "ICU Capacity" "/api/capacity/icu"
test_endpoint "Capacity Forecast" "/api/capacity/forecast"
test_endpoint "Occupancy Stats" "/api/capacity/stats"

echo ""
echo "👥 Requirement 7: Staff Scheduling"
test_endpoint "Staff Schedule" "/api/staff/schedule"
test_endpoint "Workload Analysis" "/api/staff/workload"
test_endpoint "Burnout Detection" "/api/staff/burnout-risk"
test_endpoint "Staff List" "/api/staff"

echo ""
echo "💰 Requirement 8: Automated Billing"
test_endpoint "Generate Medical Codes" "/api/billing/codes" "POST"
test_endpoint "Submit Claim" "/api/billing/claims" "POST"
test_endpoint "Claim Status" "/api/billing/claims/status"
test_endpoint "Billing Summary" "/api/billing/summary"

echo ""
echo "📦 Requirement 9: Supply Chain Management"
test_endpoint "Drug Inventory Forecast" "/api/inventory/drugs/forecast"
test_endpoint "Blood Bank Status" "/api/inventory/blood"
test_endpoint "Expiry Alerts" "/api/inventory/expiry-alerts"
test_endpoint "Inventory Summary" "/api/inventory/summary"

echo ""
echo "🦠 Requirement 10: Infection Surveillance"
test_endpoint "Infection Clusters" "/api/surveillance/clusters"
test_endpoint "HAI Detection" "/api/surveillance/hai"
test_endpoint "Outbreak Alerts" "/api/surveillance/alerts"
test_endpoint "Surveillance Stats" "/api/surveillance/stats"

echo ""
echo "🌍 Requirement 11: Regional Disease Prediction"
test_endpoint "Disease Forecast" "/api/public-health/forecast"
test_endpoint "Outbreak Probability" "/api/public-health/outbreak-risk"
test_endpoint "Disease Heatmap" "/api/public-health/heatmap"
test_endpoint "Regional Stats" "/api/public-health/stats"

echo ""
echo "🏠 Requirement 12: Post-Discharge Care"
test_endpoint "Recovery Plan" "/api/discharge/recovery-plan"
test_endpoint "Medication Reminders" "/api/discharge/reminders"
test_endpoint "Follow-up Calls" "/api/discharge/follow-up"
test_endpoint "Discharge Summary" "/api/discharge/summary"

echo ""
echo "📚 Requirement 13: Clinician Intelligence Hub"
test_endpoint "Literature Search" "/api/cdss/literature"
test_endpoint "Clinical Trials" "/api/cdss/trials"
test_endpoint "Guidelines Check" "/api/cdss/guidelines"
test_endpoint "CDSS Recommendations" "/api/cdss/recommendations"

echo ""
echo "👩‍⚕️ Requirement 14: Nurse Task Coordination"
test_endpoint "Task List" "/api/nurse/tasks"
test_endpoint "Task Priority" "/api/nurse/tasks/prioritize" "POST"
test_endpoint "Workload Alert" "/api/nurse/workload-alert"
test_endpoint "Patient Assignments" "/api/nurse/assignments"

echo ""
echo "📱 Requirement 15: Offline Capability"
test_endpoint "Sync Status" "/api/sync/status"
test_endpoint "Offline Data" "/api/sync/offline-data"
test_endpoint "Sync Trigger" "/api/sync/trigger" "POST"

echo ""
echo "📊 Requirement 16: Multi-Stakeholder Dashboard"
test_endpoint "Patient Dashboard" "/api/dashboard/patient"
test_endpoint "Clinician Dashboard" "/api/dashboard/clinician"
test_endpoint "Admin Dashboard" "/api/dashboard/admin"
test_endpoint "Public Health Dashboard" "/api/dashboard/public-health"

echo ""
echo "🔒 Requirement 17: Security and Privacy"
test_endpoint "Authentication" "/api/auth/login" "POST"
test_endpoint "Authorization" "/api/auth/verify"
test_endpoint "Audit Logs" "/api/audit/logs"
test_endpoint "User Profile" "/api/auth/profile"

echo ""
echo "⚡ Requirement 18: System Performance"
test_endpoint "System Health" "/health"
test_endpoint "Metrics" "/api/metrics"
test_endpoint "Performance Stats" "/api/performance"

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Total Endpoints Tested: $TOTAL_TESTS"
echo -e "${GREEN}Implemented: $IMPLEMENTED${NC}"
echo -e "${RED}Not Implemented: $NOT_IMPLEMENTED${NC}"
echo ""

IMPLEMENTATION_RATE=$((IMPLEMENTED * 100 / TOTAL_TESTS))
echo -e "${BLUE}Implementation Rate: $IMPLEMENTATION_RATE%${NC}"
echo ""

if [ $IMPLEMENTATION_RATE -lt 20 ]; then
    echo -e "${RED}❌ CRITICAL: Most endpoints are not implemented!${NC}"
    echo "The backend is currently a minimal mock server with only basic endpoints."
elif [ $IMPLEMENTATION_RATE -lt 50 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Less than half of the endpoints are implemented.${NC}"
elif [ $IMPLEMENTATION_RATE -lt 80 ]; then
    echo -e "${YELLOW}⚠️  PARTIAL: Most endpoints are implemented but some are missing.${NC}"
else
    echo -e "${GREEN}✅ GOOD: Most endpoints are implemented!${NC}"
fi
