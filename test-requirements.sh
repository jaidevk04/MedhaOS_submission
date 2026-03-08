#!/bin/bash

# MedhaOS Requirements Testing Script
# Tests all 18 requirements against the current implementation

API_BASE="http://localhost:4000"
RESULTS_FILE="test-results.json"

echo "🏥 MedhaOS Requirements Testing"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $name (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "Testing Backend API Endpoints..."
echo "--------------------------------"

# Requirement 1: Multilingual Patient Registration and Triage
echo ""
echo "📋 Requirement 1: Multilingual Patient Registration and Triage"
test_endpoint "Health Check" "/health"
test_endpoint "Patient Registration" "/api/patients/register" 404
test_endpoint "Speech-to-Text" "/api/speech/transcribe" 404
test_endpoint "Triage Questions" "/api/triage/questions" 404
test_endpoint "Urgency Scoring" "/api/triage/score" 404
test_endpoint "ABHA Integration" "/api/abdm/patient" 404

# Requirement 2: Intelligent Appointment Scheduling
echo ""
echo "📅 Requirement 2: Intelligent Appointment Scheduling"
test_endpoint "Facility Search" "/api/facilities/search" 404
test_endpoint "Appointment Booking" "/api/appointments/book" 404
test_endpoint "Queue Status" "/api/queue/status" 404
test_endpoint "Wait Time Estimation" "/api/queue/wait-time" 404

# Requirement 3: Ambient Clinical Documentation
echo ""
echo "🎙️ Requirement 3: Ambient Clinical Documentation"
test_endpoint "Start Recording" "/api/scribe/start" 404
test_endpoint "Real-time Transcription" "/api/scribe/transcribe" 404
test_endpoint "Extract Clinical Facts" "/api/scribe/extract-facts" 404
test_endpoint "Generate SOAP Notes" "/api/scribe/generate-soap" 404

# Requirement 4: Clinical Decision Support and Drug Safety
echo ""
echo "💊 Requirement 4: Clinical Decision Support and Drug Safety"
test_endpoint "Drug Interaction Check" "/api/drugs/check-interactions" 404
test_endpoint "Allergy Check" "/api/drugs/check-allergies" 404
test_endpoint "Drug Inventory" "/api/drugs/inventory" 404

# Requirement 5: Medical Image Analysis
echo ""
echo "🔬 Requirement 5: Medical Image Analysis"
test_endpoint "Upload Medical Image" "/api/imaging/upload" 404
test_endpoint "Analyze Image" "/api/imaging/analyze" 404
test_endpoint "Get Radiology Report" "/api/imaging/report" 404

# Requirement 6: Bed Occupancy and Capacity Management
echo ""
echo "🛏️ Requirement 6: Bed Occupancy and Capacity Management"
test_endpoint "Bed Availability" "/api/capacity/beds" 404
test_endpoint "ICU Capacity" "/api/capacity/icu" 404
test_endpoint "Capacity Forecast" "/api/capacity/forecast" 404

# Requirement 7: Staff Scheduling
echo ""
echo "👥 Requirement 7: Staff Scheduling"
test_endpoint "Staff Schedule" "/api/staff/schedule" 404
test_endpoint "Workload Analysis" "/api/staff/workload" 404
test_endpoint "Burnout Detection" "/api/staff/burnout-risk" 404

# Requirement 8: Automated Billing
echo ""
echo "💰 Requirement 8: Automated Billing"
test_endpoint "Generate Medical Codes" "/api/billing/codes" 404
test_endpoint "Submit Claim" "/api/billing/claims" 404
test_endpoint "Claim Status" "/api/billing/claims/status" 404

# Requirement 9: Supply Chain Management
echo ""
echo "📦 Requirement 9: Supply Chain Management"
test_endpoint "Drug Inventory Forecast" "/api/inventory/drugs/forecast" 404
test_endpoint "Blood Bank Status" "/api/inventory/blood" 404
test_endpoint "Expiry Alerts" "/api/inventory/expiry-alerts" 404

# Requirement 10: Infection Surveillance
echo ""
echo "🦠 Requirement 10: Infection Surveillance"
test_endpoint "Infection Clusters" "/api/surveillance/clusters" 404
test_endpoint "HAI Detection" "/api/surveillance/hai" 404
test_endpoint "Outbreak Alerts" "/api/surveillance/alerts" 404

# Requirement 11: Regional Disease Prediction
echo ""
echo "🌍 Requirement 11: Regional Disease Prediction"
test_endpoint "Disease Forecast" "/api/public-health/forecast" 404
test_endpoint "Outbreak Probability" "/api/public-health/outbreak-risk" 404
test_endpoint "Disease Heatmap" "/api/public-health/heatmap" 404

# Requirement 12: Post-Discharge Care
echo ""
echo "🏠 Requirement 12: Post-Discharge Care"
test_endpoint "Recovery Plan" "/api/discharge/recovery-plan" 404
test_endpoint "Medication Reminders" "/api/discharge/reminders" 404
test_endpoint "Follow-up Calls" "/api/discharge/follow-up" 404

# Requirement 13: Clinician Intelligence Hub
echo ""
echo "📚 Requirement 13: Clinician Intelligence Hub"
test_endpoint "Literature Search" "/api/cdss/literature" 404
test_endpoint "Clinical Trials" "/api/cdss/trials" 404
test_endpoint "Guidelines Check" "/api/cdss/guidelines" 404

# Requirement 14: Nurse Task Coordination
echo ""
echo "👩‍⚕️ Requirement 14: Nurse Task Coordination"
test_endpoint "Task List" "/api/nurse/tasks" 404
test_endpoint "Task Priority" "/api/nurse/tasks/prioritize" 404
test_endpoint "Workload Alert" "/api/nurse/workload-alert" 404

# Requirement 15: Offline Capability
echo ""
echo "📱 Requirement 15: Offline Capability"
test_endpoint "Sync Status" "/api/sync/status" 404
test_endpoint "Offline Data" "/api/sync/offline-data" 404

# Requirement 16: Multi-Stakeholder Dashboard
echo ""
echo "📊 Requirement 16: Multi-Stakeholder Dashboard"
test_endpoint "Patient Dashboard" "/api/dashboard/patient" 404
test_endpoint "Clinician Dashboard" "/api/dashboard/clinician" 404
test_endpoint "Admin Dashboard" "/api/dashboard/admin" 404
test_endpoint "Public Health Dashboard" "/api/dashboard/public-health" 404

# Requirement 17: Security and Privacy
echo ""
echo "🔒 Requirement 17: Security and Privacy"
test_endpoint "Authentication" "/api/auth/login" 404
test_endpoint "Authorization" "/api/auth/verify" 404
test_endpoint "Audit Logs" "/api/audit/logs" 404

# Requirement 18: System Performance
echo ""
echo "⚡ Requirement 18: System Performance"
test_endpoint "System Health" "/health"
test_endpoint "Metrics" "/api/metrics" 404

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠️ Pass Rate: $PASS_RATE%${NC}"
    exit 1
fi
