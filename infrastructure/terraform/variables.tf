variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "eks_node_instance_types" {
  description = "Instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "eks_node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 10
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.large"
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 500
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "elasticache_num_cache_nodes" {
  description = "Number of ElastiCache nodes"
  type        = number
  default     = 2
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for RDS and ElastiCache"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

# Load Balancer Variables
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "medhaos.health"
}

# Auto Scaling Variables
variable "api_gateway_instance_type" {
  description = "Instance type for API Gateway"
  type        = string
  default     = "t3.medium"
}

variable "api_gateway_min_size" {
  description = "Minimum number of API Gateway instances"
  type        = number
  default     = 2
}

variable "api_gateway_max_size" {
  description = "Maximum number of API Gateway instances"
  type        = number
  default     = 10
}

variable "api_gateway_desired_capacity" {
  description = "Desired number of API Gateway instances"
  type        = number
  default     = 3
}

variable "enable_scheduled_scaling" {
  description = "Enable scheduled scaling for predictable traffic patterns"
  type        = bool
  default     = false
}

variable "bastion_cidr" {
  description = "CIDR block for bastion host access"
  type        = string
  default     = "10.0.0.0/24"
}

variable "enable_read_replica" {
  description = "Enable RDS read replica"
  type        = bool
  default     = true
}

# Multi-Region Variables
variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "ap-south-2"  # Hyderabad
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary region VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "enable_cross_region_replica" {
  description = "Enable cross-region RDS read replica"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for failover and critical alerts"
  type        = string
  default     = "ops@medhaos.health"
}
