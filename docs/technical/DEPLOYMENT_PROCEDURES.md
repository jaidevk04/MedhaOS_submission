# MedhaOS Deployment Procedures

## Overview

This document provides step-by-step procedures for deploying MedhaOS Healthcare Intelligence Ecosystem to production, staging, and development environments.

**Last Updated:** February 26, 2026  
**Version:** 1.0.0

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Database Migration](#database-migration)
6. [Verification & Testing](#verification--testing)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

Install the following tools before deployment:

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Terraform
wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip
unzip terraform_1.7.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# ArgoCD CLI
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
```

### AWS Credentials

Configure AWS credentials:

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: ap-south-1
# Default output format: json
```

### Environment Variables

Create `.env` file:

```bash
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=123456789012

# Database Configuration
DB_HOST=medhaos-prod.cluster-xxxxx.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=medhaos
DB_USER=medhaos_admin
DB_PASSWORD=<secure_password>

# Redis Configuration
REDIS_HOST=medhaos-prod.xxxxx.cache.amazonaws.com
REDIS_PORT=6379

# API Keys
BHASHINI_API_KEY=<bhashini_key>
ABDM_CLIENT_ID=<abdm_client_id>
ABDM_CLIENT_SECRET=<abdm_secret>

# JWT Configuration
JWT_SECRET=<secure_random_string>
JWT_EXPIRY=900

# Environment
NODE_ENV=production
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/medhaos/healthcare-platform.git
cd healthcare-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
npm run install:all
```

### 3. Build Docker Images

```bash
# Build all services
npm run docker:build

# Or build individual services
docker build -t medhaos/api-gateway:latest ./services/api-gateway
docker build -t medhaos/triage-agent:latest ./services/triage-agent
# ... repeat for all services
```

### 4. Push to Container Registry

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-south-1.amazonaws.com

# Tag and push images
docker tag medhaos/api-gateway:latest 123456789012.dkr.ecr.ap-south-1.amazonaws.com/medhaos/api-gateway:latest
docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/medhaos/api-gateway:latest

# Or use script
./scripts/push-images.sh
```

---

## Infrastructure Deployment

### 1. Deploy with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan -var-file="terraform.tfvars"

# Apply infrastructure
terraform apply -var-file="terraform.tfvars"
```

**Terraform will create:**
- VPC with public/private subnets
- EKS cluster
- RDS PostgreSQL database
- DynamoDB tables
- S3 buckets
- ElastiCache Redis
- Application Load Balancer
- Route53 DNS records
- Security groups
- IAM roles and policies

### 2. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name medhaos-prod-cluster

# Verify connection
kubectl get nodes
```

### 3. Install Kubernetes Add-ons

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=medhaos-prod-cluster

# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install Cluster Autoscaler
kubectl apply -f infrastructure/kubernetes/cluster-autoscaler.yaml
```

### 4. Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose ArgoCD server
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Login to ArgoCD
argocd login <ARGOCD_SERVER>
argocd account update-password
```

---

## Application Deployment

### Method 1: Using Helm (Manual)

```bash
cd infrastructure/helm/medhaos

# Create namespace
kubectl create namespace medhaos-prod

# Create secrets
kubectl create secret generic medhaos-secrets \
  --from-env-file=.env \
  -n medhaos-prod

# Install Helm chart
helm install medhaos . \
  -f values-production.yaml \
  -n medhaos-prod

# Verify deployment
kubectl get pods -n medhaos-prod
kubectl get services -n medhaos-prod
```

### Method 2: Using ArgoCD (GitOps - Recommended)

```bash
# Create ArgoCD application
kubectl apply -f infrastructure/argocd/medhaos-application.yaml

# Sync application
argocd app sync medhaos-prod

# Watch deployment
argocd app get medhaos-prod --watch
```

### Verify Deployment

```bash
# Check pod status
kubectl get pods -n medhaos-prod

# Check services
kubectl get svc -n medhaos-prod

# Check ingress
kubectl get ingress -n medhaos-prod

# View logs
kubectl logs -f deployment/api-gateway -n medhaos-prod
```

---

## Database Migration

### 1. Run Prisma Migrations

```bash
cd packages/database

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### 2. Seed Database (Optional)

```bash
# Run seed script
npx prisma db seed

# Or use custom seed
npm run seed:production
```

### 3. Create Indexes

```bash
# Connect to database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Run index creation script
\i packages/database/src/indexes.sql
```

### 4. Setup DynamoDB Tables

```bash
cd packages/database/scripts

# Run DynamoDB setup
npm run setup:dynamodb
```

---

## Verification & Testing

### 1. Health Checks

```bash
# API Gateway health
curl https://api.medhaos.health/health

# Individual service health
kubectl exec -it deployment/api-gateway -n medhaos-prod -- curl http://localhost:3000/health
```

### 2. Smoke Tests

```bash
# Run smoke tests
npm run test:smoke

# Test authentication
curl -X POST https://api.medhaos.health/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"test@medhaos.health","password":"test123"}'

# Test patient API
curl https://api.medhaos.health/v1/patients/test-patient-id \
  -H "Authorization: Bearer <token>"
```

### 3. Load Testing

```bash
# Run k6 load test
cd tests/load
k6 run k6/normal-load.js
```

### 4. End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e:production
```

---

## Rollback Procedures

### Rollback Application

#### Using Helm

```bash
# List releases
helm list -n medhaos-prod

# Rollback to previous version
helm rollback medhaos -n medhaos-prod

# Rollback to specific revision
helm rollback medhaos 3 -n medhaos-prod
```

#### Using ArgoCD

```bash
# Rollback to previous sync
argocd app rollback medhaos-prod

# Rollback to specific revision
argocd app rollback medhaos-prod 5
```

#### Using kubectl

```bash
# Rollback deployment
kubectl rollout undo deployment/api-gateway -n medhaos-prod

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=2 -n medhaos-prod
```

### Rollback Database

```bash
cd packages/database

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or restore from backup
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier medhaos-prod-cluster \
  --db-cluster-identifier medhaos-prod-cluster-restored \
  --restore-to-time 2026-02-26T14:00:00Z
```

### Rollback Infrastructure

```bash
cd infrastructure/terraform

# Revert to previous state
terraform apply -var-file="terraform.tfvars" -target=<resource>

# Or restore from state backup
cp terraform.tfstate.backup terraform.tfstate
terraform apply -var-file="terraform.tfvars"
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

**Symptoms:**
- Pods stuck in `Pending` or `CrashLoopBackOff` state

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n medhaos-prod
kubectl logs <pod-name> -n medhaos-prod
```

**Solutions:**
- Check resource limits (CPU, memory)
- Verify image pull secrets
- Check environment variables
- Review application logs

#### 2. Database Connection Issues

**Symptoms:**
- Services unable to connect to database
- Connection timeout errors

**Diagnosis:**
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

**Solutions:**
- Verify security group rules
- Check database credentials
- Ensure VPC peering is configured
- Verify RDS endpoint

#### 3. High Latency

**Symptoms:**
- API responses taking > 5 seconds
- Timeout errors

**Diagnosis:**
```bash
# Check pod metrics
kubectl top pods -n medhaos-prod

# Check HPA status
kubectl get hpa -n medhaos-prod

# View Prometheus metrics
kubectl port-forward -n medhaos-monitoring svc/prometheus 9090:9090
```

**Solutions:**
- Scale up pods
- Increase resource limits
- Check database query performance
- Review cache hit rate

#### 4. Image Pull Errors

**Symptoms:**
- `ImagePullBackOff` or `ErrImagePull` errors

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n medhaos-prod
```

**Solutions:**
- Verify ECR repository exists
- Check IAM permissions
- Ensure image tag is correct
- Re-authenticate with ECR

#### 5. Certificate Issues

**Symptoms:**
- SSL/TLS errors
- Certificate expired warnings

**Diagnosis:**
```bash
# Check certificate
kubectl get certificate -n medhaos-prod
kubectl describe certificate medhaos-tls -n medhaos-prod
```

**Solutions:**
- Renew certificate
- Update cert-manager
- Verify DNS records

### Debugging Commands

```bash
# Get all resources
kubectl get all -n medhaos-prod

# Describe resource
kubectl describe <resource-type> <resource-name> -n medhaos-prod

# View logs
kubectl logs -f <pod-name> -n medhaos-prod

# Execute command in pod
kubectl exec -it <pod-name> -n medhaos-prod -- /bin/bash

# Port forward
kubectl port-forward <pod-name> 8080:3000 -n medhaos-prod

# View events
kubectl get events -n medhaos-prod --sort-by='.lastTimestamp'

# Check resource usage
kubectl top nodes
kubectl top pods -n medhaos-prod
```

### Log Analysis

```bash
# View CloudWatch logs
aws logs tail /aws/eks/medhaos-prod-cluster/cluster --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/eks/medhaos-prod-cluster/cluster \
  --filter-pattern "ERROR"

# Export logs
kubectl logs deployment/api-gateway -n medhaos-prod > api-gateway.log
```

---

## Monitoring Deployment

### Grafana Dashboards

```bash
# Port forward Grafana
kubectl port-forward -n medhaos-monitoring svc/grafana 3000:3000

# Access at http://localhost:3000
# Default credentials: admin/admin
```

### Prometheus Queries

```bash
# Port forward Prometheus
kubectl port-forward -n medhaos-monitoring svc/prometheus 9090:9090

# Example queries:
# - Request rate: rate(http_requests_total[5m])
# - Error rate: rate(http_requests_total{status=~"5.."}[5m])
# - Latency: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### AWS CloudWatch

```bash
# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EKS \
  --metric-name cluster_failed_node_count \
  --dimensions Name=ClusterName,Value=medhaos-prod-cluster \
  --start-time 2026-02-26T00:00:00Z \
  --end-time 2026-02-26T23:59:59Z \
  --period 3600 \
  --statistics Average
```

---

## Post-Deployment Checklist

- [ ] All pods running and healthy
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Monitoring dashboards accessible
- [ ] Alerts configured
- [ ] Backup jobs running
- [ ] Documentation updated
- [ ] Team notified
- [ ] Incident response plan reviewed

---

## Maintenance Windows

**Scheduled Maintenance:**
- Every Sunday 02:00-04:00 IST
- Notifications sent 48 hours in advance
- Maintenance mode enabled during updates

**Emergency Maintenance:**
- Critical security patches
- Database failover
- Infrastructure issues

---

## Support Contacts

**DevOps Team:**
- Email: devops@medhaos.health
- Slack: #medhaos-devops
- On-call: +91-XXXX-XXXX

**Database Team:**
- Email: dba@medhaos.health
- Slack: #medhaos-database

**Security Team:**
- Email: security@medhaos.health
- Slack: #medhaos-security

---

**Document Version:** 1.0.0  
**Last Updated:** February 26, 2026  
**Maintained By:** MedhaOS DevOps Team
