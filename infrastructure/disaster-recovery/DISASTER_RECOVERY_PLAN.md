# MedhaOS Disaster Recovery Plan

## Executive Summary

This document outlines the disaster recovery (DR) procedures for the MedhaOS Healthcare Intelligence Ecosystem. The plan ensures business continuity and data protection in the event of system failures, natural disasters, or other catastrophic events.

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Critical Services**: < 2 minutes
- **Database Services**: < 5 minutes
- **Full System Recovery**: < 15 minutes

### Recovery Point Objective (RPO)
- **Application Data**: 0 (real-time replication)
- **Database Data**: < 5 seconds
- **Medical Images**: < 15 minutes
- **Logs and Metrics**: < 1 hour

## Disaster Scenarios

### Scenario 1: Primary Region Failure (Mumbai)

**Trigger**: Complete AWS region outage or datacenter failure

**Impact**: All services in primary region unavailable

**Recovery Procedure**:

1. **Automatic Failover** (0-2 minutes)
   - Route 53 health checks detect primary region failure
   - DNS automatically routes traffic to secondary region (Hyderabad)
   - Application continues with minimal disruption

2. **Database Promotion** (2-5 minutes)
   ```bash
   # Promote RDS read replica to standalone instance
   aws rds promote-read-replica \
     --db-instance-identifier medhaos-production-db-replica \
     --region ap-south-2
   
   # Wait for promotion to complete
   aws rds wait db-instance-available \
     --db-instance-identifier medhaos-production-db-replica \
     --region ap-south-2
   ```

3. **Application Configuration Update** (5-10 minutes)
   ```bash
   # Update database connection strings
   kubectl set env deployment -n medhaos-production \
     DATABASE_URL="postgresql://medhaos-production-db-replica.ap-south-2.rds.amazonaws.com:5432/medhaos"
   
   # Restart pods to pick up new configuration
   kubectl rollout restart deployment -n medhaos-production
   ```

4. **Verification** (10-15 minutes)
   - Verify all services are healthy
   - Check database connectivity
   - Run smoke tests
   - Monitor error rates and latency

**Rollback**: Not applicable (primary region unavailable)

### Scenario 2: Database Failure

**Trigger**: RDS instance failure or corruption

**Impact**: Database unavailable, application cannot read/write data

**Recovery Procedure**:

1. **Automatic Failover** (0-30 seconds)
   - Multi-AZ RDS automatically fails over to standby
   - Application reconnects automatically

2. **Manual Failover to Read Replica** (if Multi-AZ fails)
   ```bash
   # Promote read replica
   aws rds promote-read-replica \
     --db-instance-identifier medhaos-production-db-read-replica \
     --region ap-south-1
   
   # Update application configuration
   kubectl set env deployment -n medhaos-production \
     DATABASE_URL="postgresql://medhaos-production-db-read-replica.ap-south-1.rds.amazonaws.com:5432/medhaos"
   ```

3. **Point-in-Time Recovery** (if data corruption)
   ```bash
   # Restore from automated backup
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier medhaos-production-db \
     --target-db-instance-identifier medhaos-production-db-restored \
     --restore-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
     --region ap-south-1
   
   # Wait for restore to complete
   aws rds wait db-instance-available \
     --db-instance-identifier medhaos-production-db-restored \
     --region ap-south-1
   
   # Update application to use restored database
   kubectl set env deployment -n medhaos-production \
     DATABASE_URL="postgresql://medhaos-production-db-restored.ap-south-1.rds.amazonaws.com:5432/medhaos"
   ```

**Rollback**: Revert to original database once issue is resolved

### Scenario 3: EKS Cluster Failure

**Trigger**: Control plane failure or node group issues

**Impact**: Application pods unavailable

**Recovery Procedure**:

1. **Node Group Recovery** (0-5 minutes)
   ```bash
   # Check node status
   kubectl get nodes
   
   # If nodes are NotReady, drain and delete
   kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
   kubectl delete node <node-name>
   
   # Auto Scaling Group will launch new nodes automatically
   ```

2. **Control Plane Recovery** (5-15 minutes)
   - AWS automatically recovers EKS control plane
   - No manual intervention required
   - Monitor recovery progress in AWS Console

3. **Application Recovery** (15-20 minutes)
   ```bash
   # Verify pods are running
   kubectl get pods -n medhaos-production
   
   # If pods are stuck, force restart
   kubectl delete pods -n medhaos-production --all
   
   # Verify deployment rollout
   kubectl rollout status deployment -n medhaos-production
   ```

**Rollback**: Not applicable (cluster recovered)

### Scenario 4: Data Loss or Corruption

**Trigger**: Accidental deletion, ransomware, or data corruption

**Impact**: Critical data unavailable or corrupted

**Recovery Procedure**:

1. **Identify Scope** (0-5 minutes)
   ```bash
   # Check RDS automated backups
   aws rds describe-db-snapshots \
     --db-instance-identifier medhaos-production-db \
     --region ap-south-1
   
   # Check S3 versioning
   aws s3api list-object-versions \
     --bucket medhaos-production-medical-images-primary \
     --prefix <affected-path>
   
   # Check DynamoDB point-in-time recovery
   aws dynamodb describe-continuous-backups \
     --table-name medhaos-production-agent-tasks \
     --region ap-south-1
   ```

2. **Restore RDS Data** (5-30 minutes)
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier medhaos-production-db-restored \
     --db-snapshot-identifier <snapshot-id> \
     --region ap-south-1
   
   # Or restore to point in time
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier medhaos-production-db \
     --target-db-instance-identifier medhaos-production-db-restored \
     --restore-time <timestamp> \
     --region ap-south-1
   ```

3. **Restore S3 Data** (5-15 minutes)
   ```bash
   # Restore specific object version
   aws s3api copy-object \
     --bucket medhaos-production-medical-images-primary \
     --copy-source medhaos-production-medical-images-primary/<key>?versionId=<version-id> \
     --key <key>
   
   # Or restore from secondary region
   aws s3 sync \
     s3://medhaos-production-medical-images-secondary/<path> \
     s3://medhaos-production-medical-images-primary/<path> \
     --source-region ap-south-2 \
     --region ap-south-1
   ```

4. **Restore DynamoDB Data** (5-20 minutes)
   ```bash
   # Restore table to point in time
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name medhaos-production-agent-tasks \
     --target-table-name medhaos-production-agent-tasks-restored \
     --restore-date-time <timestamp> \
     --region ap-south-1
   
   # Wait for restore to complete
   aws dynamodb wait table-exists \
     --table-name medhaos-production-agent-tasks-restored \
     --region ap-south-1
   
   # Update application to use restored table
   kubectl set env deployment -n medhaos-production \
     DYNAMODB_AGENT_TASKS_TABLE=medhaos-production-agent-tasks-restored
   ```

**Rollback**: Keep both original and restored resources until verification complete

### Scenario 5: Security Breach or Ransomware

**Trigger**: Unauthorized access, data encryption, or malware

**Impact**: System compromised, data at risk

**Recovery Procedure**:

1. **Immediate Response** (0-5 minutes)
   ```bash
   # Isolate affected resources
   aws ec2 modify-instance-attribute \
     --instance-id <instance-id> \
     --no-source-dest-check
   
   # Revoke all IAM credentials
   aws iam update-access-key \
     --access-key-id <key-id> \
     --status Inactive
   
   # Enable GuardDuty findings
   aws guardduty list-findings \
     --detector-id <detector-id> \
     --region ap-south-1
   ```

2. **Forensics** (5-30 minutes)
   - Capture EBS snapshots for analysis
   - Export CloudTrail logs
   - Preserve VPC Flow Logs
   - Document timeline of events

3. **Clean Recovery** (30-60 minutes)
   ```bash
   # Deploy fresh infrastructure from known-good state
   cd infrastructure/terraform
   terraform apply -var-file=terraform.tfvars
   
   # Restore data from pre-breach backups
   # (Use procedures from Scenario 4)
   
   # Deploy application from verified images
   helm upgrade --install medhaos-production \
     ./infrastructure/helm/medhaos \
     --namespace medhaos-production \
     --values ./infrastructure/helm/medhaos/values-production.yaml \
     --set global.imageTag=<verified-tag>
   ```

4. **Security Hardening** (60-120 minutes)
   - Rotate all secrets and credentials
   - Update security groups
   - Enable additional monitoring
   - Implement lessons learned

**Rollback**: Not applicable (compromised system must be rebuilt)

## Backup Procedures

### Automated Backups

#### RDS PostgreSQL
- **Frequency**: Continuous (automated backups)
- **Retention**: 30 days
- **Backup Window**: 03:00-04:00 IST
- **Verification**: Daily automated restore test

#### DynamoDB
- **Frequency**: Continuous (point-in-time recovery)
- **Retention**: 35 days
- **On-Demand Backups**: Weekly full backup
- **Verification**: Monthly restore test

#### S3 Medical Images
- **Frequency**: Real-time replication to secondary region
- **Retention**: 7 years (compliance requirement)
- **Versioning**: Enabled (30 days)
- **Verification**: Weekly replication lag check

#### EKS Configuration
- **Frequency**: On every change (GitOps)
- **Retention**: Unlimited (Git history)
- **Backup**: Helm releases, ConfigMaps, Secrets
- **Verification**: Continuous (ArgoCD sync status)

### Manual Backup Procedures

#### Full System Backup
```bash
#!/bin/bash
# Run weekly full system backup

# 1. Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier medhaos-production-db \
  --db-snapshot-identifier medhaos-manual-$(date +%Y%m%d) \
  --region ap-south-1

# 2. Create DynamoDB backups
for table in agent-tasks session-data queue-management; do
  aws dynamodb create-backup \
    --table-name medhaos-production-$table \
    --backup-name medhaos-manual-$table-$(date +%Y%m%d) \
    --region ap-south-1
done

# 3. Export Kubernetes resources
kubectl get all,configmap,secret -n medhaos-production -o yaml > \
  backup-k8s-$(date +%Y%m%d).yaml

# 4. Backup Terraform state
aws s3 cp \
  s3://medhaos-terraform-state/infrastructure/terraform.tfstate \
  ./backup-terraform-state-$(date +%Y%m%d).tfstate

# 5. Tag backups
aws rds add-tags-to-resource \
  --resource-name arn:aws:rds:ap-south-1:ACCOUNT_ID:snapshot:medhaos-manual-$(date +%Y%m%d) \
  --tags Key=Type,Value=Manual Key=Date,Value=$(date +%Y%m%d)
```

## Testing Procedures

### Monthly DR Drill

**Objective**: Verify failover mechanisms and recovery procedures

**Schedule**: First Sunday of each month, 02:00-06:00 IST

**Procedure**:

1. **Pre-Drill Checklist**
   - [ ] Notify all stakeholders 48 hours in advance
   - [ ] Verify all backups are current
   - [ ] Prepare rollback plan
   - [ ] Set up monitoring dashboard

2. **Drill Execution**
   ```bash
   # 1. Simulate primary region failure
   aws route53 change-resource-record-sets \
     --hosted-zone-id <zone-id> \
     --change-batch file://failover-to-secondary.json
   
   # 2. Monitor failover
   watch -n 5 'curl -s https://api.medhaos.health/health | jq'
   
   # 3. Verify secondary region
   kubectl get pods -n medhaos-production --context=secondary
   
   # 4. Run smoke tests
   npm run test:smoke -- --endpoint=https://api.medhaos.health
   
   # 5. Measure RTO/RPO
   # Record time from failure to full recovery
   
   # 6. Failback to primary
   aws route53 change-resource-record-sets \
     --hosted-zone-id <zone-id> \
     --change-batch file://failback-to-primary.json
   ```

3. **Post-Drill Review**
   - Document actual RTO vs. target
   - Document actual RPO vs. target
   - Identify issues and improvement areas
   - Update runbooks based on learnings

### Quarterly Full Recovery Test

**Objective**: Validate complete system recovery from backups

**Schedule**: Last Sunday of each quarter, 02:00-08:00 IST

**Procedure**:

1. **Create Isolated Test Environment**
   ```bash
   # Deploy test infrastructure
   cd infrastructure/terraform
   terraform workspace new dr-test
   terraform apply -var-file=terraform-dr-test.tfvars
   ```

2. **Restore All Data**
   ```bash
   # Restore RDS from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier medhaos-dr-test-db \
     --db-snapshot-identifier <latest-snapshot> \
     --region ap-south-1
   
   # Restore DynamoDB tables
   for table in agent-tasks session-data queue-management; do
     aws dynamodb restore-table-from-backup \
       --target-table-name medhaos-dr-test-$table \
       --backup-arn <backup-arn> \
       --region ap-south-1
   done
   
   # Sync S3 data
   aws s3 sync \
     s3://medhaos-production-medical-images-primary \
     s3://medhaos-dr-test-medical-images \
     --region ap-south-1
   ```

3. **Deploy Application**
   ```bash
   # Deploy to test environment
   helm upgrade --install medhaos-dr-test \
     ./infrastructure/helm/medhaos \
     --namespace medhaos-dr-test \
     --values ./infrastructure/helm/medhaos/values-dr-test.yaml
   ```

4. **Verification**
   - Run full test suite
   - Verify data integrity
   - Test all critical user flows
   - Measure recovery time

5. **Cleanup**
   ```bash
   # Destroy test environment
   terraform workspace select dr-test
   terraform destroy -auto-approve
   ```

## Contact Information

### On-Call Rotation

| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| DevOps Engineer | +91-XXXX-XXXX | +91-XXXX-XXXX | Platform Lead |
| Platform Engineer | +91-XXXX-XXXX | +91-XXXX-XXXX | Engineering Manager |
| Database Administrator | +91-XXXX-XXXX | +91-XXXX-XXXX | Platform Lead |
| Security Engineer | +91-XXXX-XXXX | +91-XXXX-XXXX | CISO |

### Communication Channels

- **Slack**: #medhaos-incidents
- **PagerDuty**: medhaos-production
- **Email**: ops@medhaos.health
- **Phone Bridge**: +91-XXXX-XXXX (PIN: XXXX)

### Escalation Path

1. **Level 1** (0-15 minutes): On-call engineer
2. **Level 2** (15-30 minutes): Platform team lead
3. **Level 3** (30-60 minutes): Engineering manager
4. **Level 4** (> 60 minutes): CTO + CEO

## Compliance and Audit

### Regulatory Requirements

- **DISHA Act**: Patient data protection and privacy
- **ISO 27001**: Information security management
- **ABDM**: Health data exchange standards
- **HIPAA-equivalent**: Healthcare data protection

### Audit Trail

All DR activities must be logged:
- Backup creation and verification
- Failover events
- Recovery procedures
- Test results
- Incident reports

### Documentation Updates

This DR plan must be reviewed and updated:
- Quarterly (scheduled review)
- After each DR drill
- After each actual incident
- When infrastructure changes

## Appendix

### A. Automation Scripts

Located in: `infrastructure/disaster-recovery/scripts/`

- `failover-to-secondary.sh`: Automated failover to secondary region
- `failback-to-primary.sh`: Automated failback to primary region
- `promote-rds-replica.sh`: Promote RDS read replica
- `restore-from-backup.sh`: Restore all services from backups
- `verify-recovery.sh`: Verify system health after recovery

### B. Configuration Files

Located in: `infrastructure/disaster-recovery/config/`

- `failover-change-batch.json`: Route 53 failover configuration
- `failback-change-batch.json`: Route 53 failback configuration
- `terraform-dr-test.tfvars`: DR test environment variables

### C. Runbooks

Located in: `infrastructure/disaster-recovery/runbooks/`

- `primary-region-failure.md`: Detailed steps for primary region failure
- `database-failure.md`: Detailed steps for database failure
- `security-breach.md`: Detailed steps for security incidents
- `data-corruption.md`: Detailed steps for data recovery

### D. Metrics and KPIs

Track and report monthly:
- Backup success rate (target: 100%)
- Backup verification success rate (target: 100%)
- Average RTO (target: < 2 minutes)
- Average RPO (target: < 5 seconds)
- DR drill success rate (target: 100%)
- Mean time to recovery (MTTR)
- Mean time between failures (MTBF)

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-04  
**Next Review Date**: 2026-06-04  
**Owner**: Platform Engineering Team  
**Approved By**: CTO
