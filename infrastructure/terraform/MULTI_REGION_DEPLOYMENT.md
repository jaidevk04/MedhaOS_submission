# Multi-Region Deployment Guide

## Overview

MedhaOS is deployed across two AWS regions for high availability and disaster recovery:

- **Primary Region**: Mumbai (ap-south-1)
- **Secondary Region**: Hyderabad (ap-south-2)

## Architecture

### Regional Components

#### Primary Region (Mumbai)
- VPC with public, private, and database subnets across 3 AZs
- EKS cluster for container orchestration
- RDS PostgreSQL (Multi-AZ) with read replicas
- ElastiCache Redis (Multi-AZ) for caching
- Application Load Balancer with HTTPS
- S3 buckets for medical images and logs
- DynamoDB Global Tables for real-time data

#### Secondary Region (Hyderabad)
- Identical VPC setup across 3 AZs
- EKS cluster (standby/active-active)
- RDS Read Replica (cross-region)
- Application Load Balancer with HTTPS
- S3 buckets (replication destination)
- DynamoDB Global Tables (replica)

### Data Replication

#### RDS PostgreSQL
- **Primary**: Multi-AZ deployment in Mumbai
- **Read Replica**: In-region read replica for read scaling
- **Cross-Region Replica**: Asynchronous replication to Hyderabad
- **Replication Lag**: Typically < 5 seconds
- **Failover Time**: < 30 seconds for cross-region promotion

#### DynamoDB Global Tables
- **Replication**: Active-active replication between regions
- **Consistency**: Eventually consistent (typically < 1 second)
- **Tables**:
  - `agent-tasks`: AI agent task tracking
  - `session-data`: User session management
  - `queue-management`: Patient queue state

#### S3 Cross-Region Replication
- **Source**: Mumbai medical images bucket
- **Destination**: Hyderabad medical images bucket
- **Replication Time**: < 15 minutes (99.99% of objects)
- **Versioning**: Enabled on both buckets
- **Encryption**: AES-256 at rest

#### ElastiCache Redis
- **Primary**: Multi-AZ cluster in Mumbai
- **Secondary**: Separate cluster in Hyderabad (no cross-region replication)
- **Note**: Cache is rebuilt on failover (acceptable for session data)

### Failover Mechanism

#### Automatic Failover (Route 53)

Route 53 health checks monitor both regions:

1. **Health Check Frequency**: Every 30 seconds
2. **Failure Threshold**: 3 consecutive failures
3. **Failover Time**: 60-90 seconds total
   - Health check detection: 90 seconds (3 × 30s)
   - DNS propagation: 60 seconds (TTL)
   - Client retry: Immediate

#### Failover Process

**Automatic Failover:**
```
1. Primary region health check fails (3 consecutive failures)
2. CloudWatch alarm triggers SNS notification
3. Route 53 automatically routes traffic to secondary region
4. Application continues with minimal disruption
```

**Manual Failover:**
```bash
# Promote RDS read replica to standalone instance
aws rds promote-read-replica \
  --db-instance-identifier medhaos-production-db-replica \
  --region ap-south-2

# Update Route 53 to point to secondary region
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://failover-change-batch.json
```

### Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

| Component | RTO | RPO | Notes |
|-----------|-----|-----|-------|
| Application Services | < 2 minutes | 0 | Stateless, immediate failover |
| RDS PostgreSQL | < 5 minutes | < 5 seconds | Cross-region replica promotion |
| DynamoDB | < 1 minute | < 1 second | Global tables active-active |
| S3 Medical Images | < 1 minute | < 15 minutes | Cross-region replication |
| ElastiCache | < 5 minutes | N/A | Cache rebuild on failover |

### Monitoring and Alerts

#### Health Checks

**Primary Region Health Check:**
- Endpoint: `https://api.medhaos.health/health`
- Frequency: 30 seconds
- Timeout: 10 seconds
- Failure threshold: 3

**Secondary Region Health Check:**
- Endpoint: `https://secondary-api.medhaos.health/health`
- Frequency: 30 seconds
- Timeout: 10 seconds
- Failure threshold: 3

#### CloudWatch Alarms

1. **Primary Region Health**
   - Metric: Route53 HealthCheckStatus
   - Threshold: < 1 (unhealthy)
   - Action: SNS notification to ops team

2. **Secondary Region Health**
   - Metric: Route53 HealthCheckStatus
   - Threshold: < 1 (unhealthy)
   - Action: SNS notification to ops team

3. **RDS Replication Lag**
   - Metric: ReplicaLag
   - Threshold: > 60 seconds
   - Action: SNS notification

4. **DynamoDB Replication Lag**
   - Metric: ReplicationLatency
   - Threshold: > 5 seconds
   - Action: SNS notification

5. **S3 Replication Lag**
   - Metric: ReplicationLatency
   - Threshold: > 900 seconds (15 minutes)
   - Action: SNS notification

### Deployment Steps

#### Initial Setup

1. **Configure Terraform Backend:**
```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket medhaos-terraform-state \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket medhaos-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name medhaos-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

2. **Initialize Terraform:**
```bash
cd infrastructure/terraform
terraform init
```

3. **Create terraform.tfvars:**
```hcl
environment                = "production"
aws_region                 = "ap-south-1"
secondary_region           = "ap-south-2"
vpc_cidr                   = "10.0.0.0/16"
secondary_vpc_cidr         = "10.1.0.0/16"
domain_name                = "medhaos.health"
alert_email                = "ops@medhaos.health"

# RDS Configuration
rds_instance_class         = "db.r6g.xlarge"
rds_allocated_storage      = 500
rds_max_allocated_storage  = 2000
enable_multi_az            = true
enable_read_replica        = true
enable_cross_region_replica = true

# EKS Configuration
eks_cluster_version        = "1.28"
eks_node_instance_types    = ["t3.xlarge", "t3.2xlarge"]
eks_node_desired_size      = 5
eks_node_min_size          = 3
eks_node_max_size          = 20

# ElastiCache Configuration
elasticache_node_type      = "cache.r6g.large"
elasticache_num_cache_nodes = 3

# Backup Configuration
backup_retention_period    = 30
```

4. **Plan and Apply:**
```bash
# Review the plan
terraform plan -out=tfplan

# Apply the configuration
terraform apply tfplan
```

#### Verify Deployment

1. **Check Health Endpoints:**
```bash
# Primary region
curl https://api.medhaos.health/health

# Secondary region (direct)
curl https://<secondary-alb-dns>/health
```

2. **Verify RDS Replication:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier medhaos-production-db-replica \
  --region ap-south-2 \
  --query 'DBInstances[0].StatusInfos'
```

3. **Verify DynamoDB Global Tables:**
```bash
aws dynamodb describe-table \
  --table-name medhaos-production-agent-tasks \
  --region ap-south-1 \
  --query 'Table.Replicas'
```

4. **Verify S3 Replication:**
```bash
aws s3api get-bucket-replication \
  --bucket medhaos-production-medical-images-primary \
  --region ap-south-1
```

### Failover Testing

#### Planned Failover Test

1. **Schedule Maintenance Window:**
   - Notify stakeholders 48 hours in advance
   - Choose low-traffic period (e.g., 2 AM IST)

2. **Execute Failover:**
```bash
# Update Route 53 to point to secondary
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://failover-to-secondary.json

# Monitor application metrics
watch -n 5 'curl -s https://api.medhaos.health/health | jq'
```

3. **Verify Secondary Region:**
   - Check application logs
   - Verify database connectivity
   - Test critical user flows
   - Monitor error rates and latency

4. **Failback to Primary:**
```bash
# After testing, failback to primary
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://failback-to-primary.json
```

#### Disaster Recovery Drill

Conduct quarterly DR drills:

1. **Simulate Primary Region Failure:**
   - Disable primary ALB health check endpoint
   - Observe automatic failover
   - Measure RTO/RPO

2. **Promote RDS Replica:**
```bash
aws rds promote-read-replica \
  --db-instance-identifier medhaos-production-db-replica \
  --region ap-south-2
```

3. **Update Application Configuration:**
   - Update database connection strings
   - Restart application pods
   - Verify data consistency

4. **Document Results:**
   - Actual RTO vs. target
   - Actual RPO vs. target
   - Issues encountered
   - Improvement actions

### Cost Optimization

#### Multi-Region Cost Breakdown

**Monthly Costs (Estimated):**

| Component | Primary Region | Secondary Region | Total |
|-----------|----------------|------------------|-------|
| EKS Cluster | $150 | $150 | $300 |
| EC2 Instances (EKS nodes) | $800 | $400 | $1,200 |
| RDS PostgreSQL | $600 | $300 | $900 |
| ElastiCache Redis | $300 | $0 | $300 |
| ALB | $50 | $50 | $100 |
| S3 Storage | $200 | $100 | $300 |
| Data Transfer | $150 | $100 | $250 |
| DynamoDB | $100 | $50 | $150 |
| Route 53 | $10 | $0 | $10 |
| **Total** | **$2,360** | **$1,150** | **$3,510** |

**Cost Optimization Strategies:**

1. **Right-size Secondary Region:**
   - Run fewer EKS nodes in standby mode
   - Use smaller RDS instance for read replica
   - No ElastiCache in secondary (rebuild on failover)

2. **Use Reserved Instances:**
   - 1-year or 3-year RDS Reserved Instances (40-60% savings)
   - EC2 Savings Plans for EKS nodes (20-40% savings)

3. **Optimize Data Transfer:**
   - Use VPC peering for inter-region communication
   - Compress data before replication
   - Use S3 Transfer Acceleration selectively

4. **Lifecycle Policies:**
   - Move old S3 objects to Glacier (90% cost reduction)
   - Delete old CloudWatch logs after 90 days
   - Archive old RDS snapshots

### Troubleshooting

#### Common Issues

**1. High Replication Lag:**
```bash
# Check RDS replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReplicaLag \
  --dimensions Name=DBInstanceIdentifier,Value=medhaos-production-db-replica \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-south-2

# Possible causes:
# - High write load on primary
# - Network issues between regions
# - Insufficient replica instance size

# Solutions:
# - Scale up replica instance
# - Reduce write load
# - Check VPC peering connection
```

**2. Failover Not Triggering:**
```bash
# Check Route 53 health check status
aws route53 get-health-check-status \
  --health-check-id <HEALTH_CHECK_ID>

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names medhaos-production-primary-region-health

# Possible causes:
# - Health check endpoint misconfigured
# - Firewall blocking health checks
# - Alarm threshold too high

# Solutions:
# - Verify /health endpoint returns 200
# - Allow Route 53 health checker IPs
# - Adjust alarm thresholds
```

**3. Data Inconsistency After Failover:**
```bash
# Check DynamoDB replication status
aws dynamodb describe-table \
  --table-name medhaos-production-agent-tasks \
  --region ap-south-2

# Check S3 replication metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name ReplicationLatency \
  --dimensions Name=SourceBucket,Value=medhaos-production-medical-images-primary \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum \
  --region ap-south-1

# Solutions:
# - Wait for replication to catch up
# - Verify replication configuration
# - Check for replication errors in CloudWatch Logs
```

### Security Considerations

1. **Encryption in Transit:**
   - TLS 1.3 for all inter-region communication
   - VPC peering for private connectivity
   - Encrypted RDS replication

2. **Encryption at Rest:**
   - KMS encryption for RDS (separate keys per region)
   - S3 server-side encryption (AES-256)
   - DynamoDB encryption enabled

3. **Access Control:**
   - Separate IAM roles for each region
   - Least privilege principle
   - MFA required for production access

4. **Audit Logging:**
   - CloudTrail enabled in both regions
   - VPC Flow Logs for network monitoring
   - RDS audit logs to CloudWatch

### Maintenance Windows

**Recommended Schedule:**

- **Primary Region**: Sunday 2:00 AM - 4:00 AM IST
- **Secondary Region**: Sunday 4:00 AM - 6:00 AM IST

**Maintenance Tasks:**

1. **Weekly:**
   - Review CloudWatch alarms
   - Check replication lag metrics
   - Verify backup completion

2. **Monthly:**
   - Test failover mechanism
   - Review and optimize costs
   - Update security patches

3. **Quarterly:**
   - Full DR drill
   - Review and update runbooks
   - Capacity planning review

### Support and Escalation

**On-Call Rotation:**
- Primary: DevOps Engineer
- Secondary: Platform Engineer
- Escalation: Engineering Manager

**Contact Information:**
- Slack: #medhaos-ops
- PagerDuty: medhaos-production
- Email: ops@medhaos.health

**Escalation Path:**
1. On-call engineer (0-15 minutes)
2. Platform team lead (15-30 minutes)
3. Engineering manager (30-60 minutes)
4. CTO (> 60 minutes or critical incident)
