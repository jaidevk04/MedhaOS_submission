# Infrastructure

This directory contains Infrastructure as Code (IaC) for the MedhaOS platform.

## Structure

### Terraform (`terraform/`)
AWS infrastructure provisioning:
- VPC and networking
- EKS cluster
- RDS PostgreSQL
- ElastiCache Redis
- S3 buckets
- Security groups
- IAM roles and policies

### Kubernetes (`kubernetes/`)
Kubernetes manifests for application deployment:
- Deployments
- Services
- Ingress
- ConfigMaps
- Secrets
- HPA (Horizontal Pod Autoscaler)

### Docker (`docker/`)
Docker configurations for local development:
- PostgreSQL initialization scripts
- Prometheus configuration
- Grafana dashboards and datasources

## Terraform Usage

### Initialize
```bash
cd infrastructure/terraform
terraform init
```

### Plan
```bash
terraform plan -var-file=terraform.tfvars
```

### Apply
```bash
terraform apply -var-file=terraform.tfvars
```

### Destroy
```bash
terraform destroy -var-file=terraform.tfvars
```

## Kubernetes Deployment

### Configure kubectl
```bash
aws eks update-kubeconfig --name medhaos-production-cluster --region ap-south-1
```

### Deploy
```bash
kubectl apply -f infrastructure/kubernetes/
```

### Check status
```bash
kubectl get pods -n medhaos
kubectl get services -n medhaos
```

## Environments

- **Development**: Local Docker Compose
- **Staging**: AWS EKS (ap-south-1)
- **Production**: AWS EKS Multi-Region (ap-south-1, ap-south-2)

## Security

- All secrets managed via AWS Secrets Manager
- Encryption at rest and in transit
- Network policies for pod-to-pod communication
- IAM roles for service accounts (IRSA)
