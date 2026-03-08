output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "eks_cluster_security_group_id" {
  description = "Security group ID for EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "eks_nodes_security_group_id" {
  description = "Security group ID for EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "Security group ID for ElastiCache"
  value       = aws_security_group.elasticache.id
}

output "alb_security_group_id" {
  description = "Security group ID for Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}

# Multi-Region Outputs

# VPC Outputs - Secondary Region
output "secondary_vpc_id" {
  description = "ID of the VPC in secondary region"
  value       = aws_vpc.secondary.id
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the VPC in secondary region"
  value       = aws_vpc.secondary.cidr_block
}

output "secondary_public_subnet_ids" {
  description = "IDs of public subnets in secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of private subnets in secondary region"
  value       = aws_subnet.secondary_private[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.main[0].endpoint
  sensitive   = true
}

output "rds_replica_endpoint" {
  description = "Endpoint of the RDS read replica in primary region"
  value       = var.enable_read_replica ? aws_db_instance.read_replica[0].endpoint : null
  sensitive   = true
}

output "rds_cross_region_replica_endpoint" {
  description = "Endpoint of the RDS read replica in secondary region"
  value       = var.enable_cross_region_replica ? aws_db_instance.secondary_replica[0].endpoint : null
  sensitive   = true
}

output "rds_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS password"
  value       = aws_secretsmanager_secret.rds_password.arn
  sensitive   = true
}

# ElastiCache Outputs
output "elasticache_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
  sensitive   = true
}

output "elasticache_port" {
  description = "Port of the ElastiCache Redis cluster"
  value       = 6379
}

# Load Balancer Outputs - Primary Region
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer in primary region"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer in primary region"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer in primary region"
  value       = aws_lb.main.arn
}

# Load Balancer Outputs - Secondary Region
output "secondary_alb_dns_name" {
  description = "DNS name of the Application Load Balancer in secondary region"
  value       = aws_lb.secondary.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the Application Load Balancer in secondary region"
  value       = aws_lb.secondary.zone_id
}

output "secondary_alb_arn" {
  description = "ARN of the Application Load Balancer in secondary region"
  value       = aws_lb.secondary.arn
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Name servers for the Route 53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "api_endpoint" {
  description = "API endpoint with automatic failover"
  value       = "https://api.${var.domain_name}"
}

output "admin_endpoint" {
  description = "Admin dashboard endpoint with automatic failover"
  value       = "https://admin.${var.domain_name}"
}

output "clinician_endpoint" {
  description = "Clinician terminal endpoint with automatic failover"
  value       = "https://clinician.${var.domain_name}"
}

output "public_health_endpoint" {
  description = "Public health dashboard endpoint with automatic failover"
  value       = "https://public-health.${var.domain_name}"
}

# DynamoDB Outputs
output "dynamodb_agent_tasks_table" {
  description = "Name of the DynamoDB agent tasks global table"
  value       = aws_dynamodb_table.agent_tasks_global.name
}

output "dynamodb_session_data_table" {
  description = "Name of the DynamoDB session data global table"
  value       = aws_dynamodb_table.session_data_global.name
}

output "dynamodb_queue_management_table" {
  description = "Name of the DynamoDB queue management global table"
  value       = aws_dynamodb_table.queue_management_global.name
}

# S3 Outputs
output "s3_medical_images_primary_bucket" {
  description = "Name of the S3 bucket for medical images in primary region"
  value       = aws_s3_bucket.medical_images_primary.id
}

output "s3_medical_images_secondary_bucket" {
  description = "Name of the S3 bucket for medical images in secondary region"
  value       = aws_s3_bucket.medical_images_secondary.id
}

# Health Check Outputs
output "primary_health_check_id" {
  description = "ID of the Route 53 health check for primary region"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "ID of the Route 53 health check for secondary region"
  value       = aws_route53_health_check.secondary.id
}

# SNS Outputs
output "failover_alerts_topic_arn" {
  description = "ARN of the SNS topic for failover alerts"
  value       = aws_sns_topic.failover_alerts.arn
}

# VPC Peering Output
output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection between primary and secondary regions"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

# Region Information
output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

# Deployment Summary
output "deployment_summary" {
  description = "Summary of multi-region deployment"
  value = {
    primary_region   = var.aws_region
    secondary_region = var.secondary_region
    environment      = var.environment
    multi_az_enabled = var.enable_multi_az
    cross_region_replication_enabled = var.enable_cross_region_replica
    failover_configured = true
    rto_target = "< 2 minutes"
    rpo_target = "< 5 seconds"
  }
}
