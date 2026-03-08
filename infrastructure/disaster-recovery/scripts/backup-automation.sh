#!/bin/bash
set -euo pipefail

# Automated Backup Script for MedhaOS
# This script creates comprehensive backups of all critical components

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
PRIMARY_REGION="ap-south-1"
BACKUP_BUCKET="medhaos-backups-${ENVIRONMENT}"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create RDS snapshot
backup_rds() {
    log_info "Creating RDS snapshot..."
    
    SNAPSHOT_ID="medhaos-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    
    aws rds create-db-snapshot \
        --db-instance-identifier "medhaos-${ENVIRONMENT}-db" \
        --db-snapshot-identifier "$SNAPSHOT_ID" \
        --region $PRIMARY_REGION \
        --tags Key=Type,Value=Automated Key=Date,Value=$(date +%Y-%m-%d)
    
    log_info "RDS snapshot created: $SNAPSHOT_ID"
}

# Backup DynamoDB tables
backup_dynamodb() {
    log_info "Creating DynamoDB backups..."
    
    TABLES=("agent-tasks" "session-data" "queue-management")
    
    for table in "${TABLES[@]}"; do
        BACKUP_NAME="medhaos-${ENVIRONMENT}-${table}-$(date +%Y%m%d-%H%M%S)"
        
        aws dynamodb create-backup \
            --table-name "medhaos-${ENVIRONMENT}-${table}" \
            --backup-name "$BACKUP_NAME" \
            --region $PRIMARY_REGION
        
        log_info "DynamoDB backup created for $table: $BACKUP_NAME"
    done
}

# Export Kubernetes resources
backup_kubernetes() {
    log_info "Backing up Kubernetes resources..."
    
    BACKUP_DIR="/tmp/k8s-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Update kubeconfig
    aws eks update-kubeconfig \
        --name "medhaos-${ENVIRONMENT}-eks" \
        --region $PRIMARY_REGION
    
    # Export all resources
    kubectl get all,configmap,secret,pvc,ingress -n medhaos-${ENVIRONMENT} -o yaml > \
        "$BACKUP_DIR/all-resources.yaml"
    
    # Export Helm releases
    helm list -n medhaos-${ENVIRONMENT} -o yaml > \
        "$BACKUP_DIR/helm-releases.yaml"
    
    # Compress and upload to S3
    tar -czf "$BACKUP_DIR.tar.gz" -C /tmp "$(basename $BACKUP_DIR)"
    
    aws s3 cp "$BACKUP_DIR.tar.gz" \
        "s3://${BACKUP_BUCKET}/kubernetes/$(basename $BACKUP_DIR).tar.gz" \
        --region $PRIMARY_REGION
    
    # Cleanup
    rm -rf "$BACKUP_DIR" "$BACKUP_DIR.tar.gz"
    
    log_info "Kubernetes backup uploaded to S3"
}

# Backup Terraform state
backup_terraform() {
    log_info "Backing up Terraform state..."
    
    aws s3 cp \
        s3://medhaos-terraform-state/infrastructure/terraform.tfstate \
        "s3://${BACKUP_BUCKET}/terraform/terraform-$(date +%Y%m%d-%H%M%S).tfstate" \
        --region $PRIMARY_REGION
    
    log_info "Terraform state backed up"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Delete old RDS snapshots
    OLD_SNAPSHOTS=$(aws rds describe-db-snapshots \
        --db-instance-identifier "medhaos-${ENVIRONMENT}-db" \
        --region $PRIMARY_REGION \
        --query "DBSnapshots[?SnapshotCreateTime<='$(date -d "$RETENTION_DAYS days ago" -u +%Y-%m-%dT%H:%M:%SZ)'].DBSnapshotIdentifier" \
        --output text)
    
    for snapshot in $OLD_SNAPSHOTS; do
        aws rds delete-db-snapshot \
            --db-snapshot-identifier "$snapshot" \
            --region $PRIMARY_REGION
        log_info "Deleted old RDS snapshot: $snapshot"
    done
    
    # Delete old S3 backups
    aws s3 ls "s3://${BACKUP_BUCKET}/kubernetes/" | \
        awk '{print $4}' | \
        while read file; do
            FILE_DATE=$(echo $file | grep -oP '\d{8}')
            if [ -n "$FILE_DATE" ]; then
                FILE_AGE=$(( ($(date +%s) - $(date -d "$FILE_DATE" +%s)) / 86400 ))
                if [ $FILE_AGE -gt $RETENTION_DAYS ]; then
                    aws s3 rm "s3://${BACKUP_BUCKET}/kubernetes/$file" --region $PRIMARY_REGION
                    log_info "Deleted old K8s backup: $file"
                fi
            fi
        done
    
    log_info "Old backups cleaned up"
}

# Verify backups
verify_backups() {
    log_info "Verifying backups..."
    
    # Verify RDS snapshot
    LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
        --db-instance-identifier "medhaos-${ENVIRONMENT}-db" \
        --region $PRIMARY_REGION \
        --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
        --output text)
    
    SNAPSHOT_STATUS=$(aws rds describe-db-snapshots \
        --db-snapshot-identifier "$LATEST_SNAPSHOT" \
        --region $PRIMARY_REGION \
        --query 'DBSnapshots[0].Status' \
        --output text)
    
    if [ "$SNAPSHOT_STATUS" = "available" ]; then
        log_info "RDS snapshot verified: $LATEST_SNAPSHOT"
    else
        log_error "RDS snapshot verification failed: $LATEST_SNAPSHOT (Status: $SNAPSHOT_STATUS)"
    fi
    
    # Verify DynamoDB backups
    for table in agent-tasks session-data queue-management; do
        LATEST_BACKUP=$(aws dynamodb list-backups \
            --table-name "medhaos-${ENVIRONMENT}-${table}" \
            --region $PRIMARY_REGION \
            --query 'BackupSummaries | sort_by(@, &BackupCreationDateTime) | [-1].BackupArn' \
            --output text)
        
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "DynamoDB backup verified for $table"
        else
            log_error "DynamoDB backup verification failed for $table"
        fi
    done
    
    log_info "Backup verification complete"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${SNS_TOPIC_ARN:-}" ]; then
        aws sns publish \
            --topic-arn $SNS_TOPIC_ARN \
            --subject "MedhaOS Backup ${status}" \
            --message "$message" \
            --region $PRIMARY_REGION
    fi
}

# Main execution
main() {
    log_info "Starting automated backup for environment: $ENVIRONMENT"
    
    START_TIME=$(date +%s)
    
    # Execute backup steps
    backup_rds
    backup_dynamodb
    backup_kubernetes
    backup_terraform
    cleanup_old_backups
    verify_backups
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_info "Backup completed successfully in ${DURATION}s"
    send_notification "Success" "Automated backup completed successfully in ${DURATION}s"
}

# Error handling
trap 'log_error "Backup failed at line $LINENO"; send_notification "Failed" "Backup failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"
