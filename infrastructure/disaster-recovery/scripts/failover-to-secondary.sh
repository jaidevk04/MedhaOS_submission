#!/bin/bash
set -euo pipefail

# Failover to Secondary Region Script
# This script automates the failover process from primary (Mumbai) to secondary (Hyderabad) region

# Configuration
PRIMARY_REGION="ap-south-1"
SECONDARY_REGION="ap-south-2"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install it first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured properly."
        exit 1
    fi
    
    # Check hosted zone ID
    if [ -z "$HOSTED_ZONE_ID" ]; then
        log_error "HOSTED_ZONE_ID environment variable not set."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Check primary region health
check_primary_health() {
    log_info "Checking primary region health..."
    
    # Check ALB health
    PRIMARY_ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region $PRIMARY_REGION \
        --query "LoadBalancers[?contains(LoadBalancerName, 'medhaos-$ENVIRONMENT')].DNSName" \
        --output text)
    
    if [ -z "$PRIMARY_ALB_DNS" ]; then
        log_error "Could not find primary ALB."
        return 1
    fi
    
    # Try to reach health endpoint
    if curl -sf --max-time 5 "https://$PRIMARY_ALB_DNS/health" > /dev/null 2>&1; then
        log_warn "Primary region appears to be healthy. Are you sure you want to failover?"
        read -p "Continue with failover? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Failover cancelled."
            exit 0
        fi
    else
        log_info "Primary region is unhealthy. Proceeding with failover."
    fi
}

# Verify secondary region readiness
verify_secondary_readiness() {
    log_info "Verifying secondary region readiness..."
    
    # Check EKS cluster
    if ! aws eks describe-cluster \
        --name "medhaos-$ENVIRONMENT-eks-secondary" \
        --region $SECONDARY_REGION &> /dev/null; then
        log_error "Secondary EKS cluster not found."
        exit 1
    fi
    
    # Check RDS replica
    RDS_REPLICA_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "medhaos-$ENVIRONMENT-db-replica" \
        --region $SECONDARY_REGION \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text)
    
    if [ "$RDS_REPLICA_STATUS" != "available" ]; then
        log_error "RDS replica is not available. Status: $RDS_REPLICA_STATUS"
        exit 1
    fi
    
    # Check replication lag
    REPLICATION_LAG=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/RDS \
        --metric-name ReplicaLag \
        --dimensions Name=DBInstanceIdentifier,Value=medhaos-$ENVIRONMENT-db-replica \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average \
        --region $SECONDARY_REGION \
        --query 'Datapoints[0].Average' \
        --output text)
    
    if [ "$REPLICATION_LAG" != "None" ] && (( $(echo "$REPLICATION_LAG > 60" | bc -l) )); then
        log_warn "Replication lag is high: ${REPLICATION_LAG}s. Data loss may occur."
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Failover cancelled."
            exit 0
        fi
    fi
    
    log_info "Secondary region is ready for failover."
}

# Update Route 53 DNS
update_dns() {
    log_info "Updating Route 53 DNS to point to secondary region..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warn "DRY RUN: Would update DNS to secondary region"
        return 0
    fi
    
    # Get secondary ALB DNS
    SECONDARY_ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region $SECONDARY_REGION \
        --query "LoadBalancers[?contains(LoadBalancerName, 'medhaos-$ENVIRONMENT-secondary')].DNSName" \
        --output text)
    
    SECONDARY_ALB_ZONE=$(aws elbv2 describe-load-balancers \
        --region $SECONDARY_REGION \
        --query "LoadBalancers[?contains(LoadBalancerName, 'medhaos-$ENVIRONMENT-secondary')].CanonicalHostedZoneId" \
        --output text)
    
    # Create change batch
    cat > /tmp/failover-change-batch.json <<EOF
{
  "Comment": "Failover to secondary region",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.medhaos.health",
        "Type": "A",
        "SetIdentifier": "secondary",
        "Failover": "SECONDARY",
        "AliasTarget": {
          "HostedZoneId": "$SECONDARY_ALB_ZONE",
          "DNSName": "$SECONDARY_ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF
    
    # Apply DNS changes
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch file:///tmp/failover-change-batch.json \
        --query 'ChangeInfo.Id' \
        --output text)
    
    log_info "DNS change submitted. Change ID: $CHANGE_ID"
    
    # Wait for DNS propagation
    log_info "Waiting for DNS propagation..."
    aws route53 wait resource-record-sets-changed --id $CHANGE_ID
    
    log_info "DNS updated successfully."
}

# Promote RDS replica
promote_rds_replica() {
    log_info "Promoting RDS read replica to standalone instance..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warn "DRY RUN: Would promote RDS replica"
        return 0
    fi
    
    # Promote replica
    aws rds promote-read-replica \
        --db-instance-identifier "medhaos-$ENVIRONMENT-db-replica" \
        --region $SECONDARY_REGION
    
    log_info "Waiting for RDS promotion to complete..."
    aws rds wait db-instance-available \
        --db-instance-identifier "medhaos-$ENVIRONMENT-db-replica" \
        --region $SECONDARY_REGION
    
    log_info "RDS replica promoted successfully."
}

# Update application configuration
update_application_config() {
    log_info "Updating application configuration..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warn "DRY RUN: Would update application configuration"
        return 0
    fi
    
    # Update kubeconfig for secondary region
    aws eks update-kubeconfig \
        --name "medhaos-$ENVIRONMENT-eks-secondary" \
        --region $SECONDARY_REGION \
        --alias secondary
    
    # Get new database endpoint
    NEW_DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier "medhaos-$ENVIRONMENT-db-replica" \
        --region $SECONDARY_REGION \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    
    # Update database URL in all deployments
    kubectl set env deployment -n medhaos-$ENVIRONMENT \
        --context=secondary \
        DATABASE_URL="postgresql://$NEW_DB_ENDPOINT:5432/medhaos"
    
    # Update region configuration
    kubectl set env deployment -n medhaos-$ENVIRONMENT \
        --context=secondary \
        AWS_REGION=$SECONDARY_REGION \
        REGION_MODE="primary"
    
    # Restart deployments
    kubectl rollout restart deployment -n medhaos-$ENVIRONMENT --context=secondary
    
    log_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment -n medhaos-$ENVIRONMENT --context=secondary --timeout=10m
    
    log_info "Application configuration updated successfully."
}

# Verify failover
verify_failover() {
    log_info "Verifying failover..."
    
    # Wait for DNS propagation
    sleep 30
    
    # Check health endpoint
    for i in {1..10}; do
        if curl -sf --max-time 10 "https://api.medhaos.health/health" > /dev/null 2>&1; then
            log_info "Health check passed."
            break
        else
            log_warn "Health check failed. Attempt $i/10. Retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    # Check all pods are running
    UNHEALTHY_PODS=$(kubectl get pods -n medhaos-$ENVIRONMENT --context=secondary \
        --field-selector=status.phase!=Running \
        --no-headers | wc -l)
    
    if [ "$UNHEALTHY_PODS" -gt 0 ]; then
        log_error "$UNHEALTHY_PODS pods are not running."
        kubectl get pods -n medhaos-$ENVIRONMENT --context=secondary
        exit 1
    fi
    
    log_info "All pods are running."
    
    # Run smoke tests
    log_info "Running smoke tests..."
    if command -v npm &> /dev/null; then
        npm run test:smoke -- --endpoint=https://api.medhaos.health || log_warn "Smoke tests failed."
    else
        log_warn "npm not found. Skipping smoke tests."
    fi
    
    log_info "Failover verification complete."
}

# Send notifications
send_notifications() {
    log_info "Sending notifications..."
    
    # Send Slack notification
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Failover to secondary region completed. System is now running in $SECONDARY_REGION.\"}" \
            $SLACK_WEBHOOK
    fi
    
    # Send SNS notification
    if [ -n "${SNS_TOPIC_ARN:-}" ]; then
        aws sns publish \
            --topic-arn $SNS_TOPIC_ARN \
            --subject "MedhaOS Failover Alert" \
            --message "Failover to secondary region ($SECONDARY_REGION) completed at $(date)." \
            --region $PRIMARY_REGION
    fi
    
    log_info "Notifications sent."
}

# Main execution
main() {
    log_info "Starting failover to secondary region..."
    log_info "Primary Region: $PRIMARY_REGION"
    log_info "Secondary Region: $SECONDARY_REGION"
    log_info "Environment: $ENVIRONMENT"
    log_info "Dry Run: $DRY_RUN"
    echo ""
    
    check_prerequisites
    check_primary_health
    verify_secondary_readiness
    
    log_warn "This will failover production traffic to the secondary region."
    read -p "Are you absolutely sure? Type 'FAILOVER' to confirm: " confirmation
    
    if [ "$confirmation" != "FAILOVER" ]; then
        log_info "Failover cancelled."
        exit 0
    fi
    
    # Record start time
    START_TIME=$(date +%s)
    
    # Execute failover steps
    update_dns
    promote_rds_replica
    update_application_config
    verify_failover
    send_notifications
    
    # Calculate RTO
    END_TIME=$(date +%s)
    RTO=$((END_TIME - START_TIME))
    
    log_info "Failover completed successfully!"
    log_info "Recovery Time: ${RTO}s ($(($RTO / 60))m $(($RTO % 60))s)"
    log_info "System is now running in secondary region: $SECONDARY_REGION"
}

# Run main function
main "$@"
