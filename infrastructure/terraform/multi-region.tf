# Multi-Region Deployment Configuration
# Primary Region: Mumbai (ap-south-1)
# Secondary Region: Hyderabad (ap-south-2)

# Secondary Region Provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Project     = "MedhaOS"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Region      = "Secondary"
    }
  }
}

# Data sources for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

locals {
  secondary_azs = slice(data.aws_availability_zones.secondary.names, 0, 3)
}

# ============================================================================
# SECONDARY REGION VPC
# ============================================================================

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-vpc-secondary"
      Region = "Secondary"
    }
  )
}

# Internet Gateway for Secondary Region
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-igw-secondary"
      Region = "Secondary"
    }
  )
}

# Public Subnets - Secondary Region
resource "aws_subnet" "secondary_public" {
  count    = length(local.secondary_azs)
  provider = aws.secondary

  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.secondary_vpc_cidr, 8, count.index)
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name                                                  = "${local.name_prefix}-public-${local.secondary_azs[count.index]}-secondary"
      Region                                                = "Secondary"
      "kubernetes.io/role/elb"                              = "1"
      "kubernetes.io/cluster/${local.name_prefix}-eks-secondary" = "shared"
    }
  )
}

# Private Subnets - Secondary Region
resource "aws_subnet" "secondary_private" {
  count    = length(local.secondary_azs)
  provider = aws.secondary

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.secondary_vpc_cidr, 8, count.index + 10)
  availability_zone = local.secondary_azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name                                                  = "${local.name_prefix}-private-${local.secondary_azs[count.index]}-secondary"
      Region                                                = "Secondary"
      "kubernetes.io/role/internal-elb"                     = "1"
      "kubernetes.io/cluster/${local.name_prefix}-eks-secondary" = "shared"
    }
  )
}

# Database Subnets - Secondary Region
resource "aws_subnet" "secondary_database" {
  count    = length(local.secondary_azs)
  provider = aws.secondary

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.secondary_vpc_cidr, 8, count.index + 20)
  availability_zone = local.secondary_azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-database-${local.secondary_azs[count.index]}-secondary"
      Region = "Secondary"
    }
  )
}

# NAT Gateways - Secondary Region
resource "aws_eip" "secondary_nat" {
  count    = var.enable_nat_gateway ? length(local.secondary_azs) : 0
  provider = aws.secondary

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-nat-eip-${local.secondary_azs[count.index]}-secondary"
      Region = "Secondary"
    }
  )

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_nat_gateway" "secondary" {
  count    = var.enable_nat_gateway ? length(local.secondary_azs) : 0
  provider = aws.secondary

  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-nat-${local.secondary_azs[count.index]}-secondary"
      Region = "Secondary"
    }
  )

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-public-rt-secondary"
      Region = "Secondary"
    }
  )
}

resource "aws_route_table_association" "secondary_public" {
  count    = length(aws_subnet.secondary_public)
  provider = aws.secondary

  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table" "secondary_private" {
  count    = length(local.secondary_azs)
  provider = aws.secondary

  vpc_id = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_nat_gateway ? aws_nat_gateway.secondary[count.index].id : null
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-private-rt-${local.secondary_azs[count.index]}-secondary"
      Region = "Secondary"
    }
  )
}

resource "aws_route_table_association" "secondary_private" {
  count    = length(aws_subnet.secondary_private)
  provider = aws.secondary

  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ============================================================================
# VPC PEERING (Primary <-> Secondary)
# ============================================================================

resource "aws_vpc_peering_connection" "primary_to_secondary" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-vpc-peering"
      Side = "Requester"
    }
  )
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-vpc-peering"
      Side = "Accepter"
    }
  )
}

# Add routes for VPC peering - Primary to Secondary
resource "aws_route" "primary_to_secondary" {
  count = length(aws_route_table.private)

  route_table_id            = aws_route_table.private[count.index].id
  destination_cidr_block    = var.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# Add routes for VPC peering - Secondary to Primary
resource "aws_route" "secondary_to_primary" {
  count    = length(aws_route_table.secondary_private)
  provider = aws.secondary

  route_table_id            = aws_route_table.secondary_private[count.index].id
  destination_cidr_block    = var.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# ============================================================================
# DATABASE REPLICATION
# ============================================================================

# RDS Subnet Group - Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${local.name_prefix}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_database[*].id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-db-subnet-group-secondary"
      Region = "Secondary"
    }
  )
}

# RDS Read Replica in Secondary Region
resource "aws_db_instance" "secondary_replica" {
  count    = var.enable_cross_region_replica ? 1 : 0
  provider = aws.secondary

  identifier     = "${local.name_prefix}-db-replica"
  replicate_source_db = aws_db_instance.main[0].arn

  instance_class        = var.rds_instance_class
  publicly_accessible   = false
  skip_final_snapshot   = var.environment != "production"
  multi_az              = var.enable_multi_az
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.secondary_rds[0].arn

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-db-replica"
      Region = "Secondary"
      Role   = "ReadReplica"
    }
  )
}

# KMS Key for RDS encryption - Secondary Region
resource "aws_kms_key" "secondary_rds" {
  count    = var.enable_cross_region_replica ? 1 : 0
  provider = aws.secondary

  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-rds-kms-secondary"
      Region = "Secondary"
    }
  )
}

resource "aws_kms_alias" "secondary_rds" {
  count    = var.enable_cross_region_replica ? 1 : 0
  provider = aws.secondary

  name          = "alias/${local.name_prefix}-rds-secondary"
  target_key_id = aws_kms_key.secondary_rds[0].key_id
}

# ============================================================================
# DYNAMODB GLOBAL TABLES
# ============================================================================

# DynamoDB Global Table for real-time operational data
resource "aws_dynamodb_table" "agent_tasks_global" {
  name             = "${local.name_prefix}-agent-tasks"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "task_id"
  range_key        = "created_at"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "task_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "agent_name"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "AgentNameIndex"
    hash_key        = "agent_name"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  replica {
    region_name = var.secondary_region
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-agent-tasks"
      Type = "GlobalTable"
    }
  )
}

resource "aws_dynamodb_table" "session_data_global" {
  name             = "${local.name_prefix}-session-data"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "expires_at"
    type = "N"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "user_id"
    range_key       = "expires_at"
    projection_type = "ALL"
  }

  replica {
    region_name = var.secondary_region
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-session-data"
      Type = "GlobalTable"
    }
  )
}

resource "aws_dynamodb_table" "queue_management_global" {
  name             = "${local.name_prefix}-queue-management"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "facility_id"
  range_key        = "patient_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "facility_id"
    type = "S"
  }

  attribute {
    name = "patient_id"
    type = "S"
  }

  attribute {
    name = "urgency_score"
    type = "N"
  }

  attribute {
    name = "queue_position"
    type = "N"
  }

  global_secondary_index {
    name            = "UrgencyIndex"
    hash_key        = "facility_id"
    range_key       = "urgency_score"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "QueuePositionIndex"
    hash_key        = "facility_id"
    range_key       = "queue_position"
    projection_type = "ALL"
  }

  replica {
    region_name = var.secondary_region
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-queue-management"
      Type = "GlobalTable"
    }
  )
}

# ============================================================================
# S3 CROSS-REGION REPLICATION
# ============================================================================

# S3 Bucket for medical images - Primary Region
resource "aws_s3_bucket" "medical_images_primary" {
  bucket = "${local.name_prefix}-medical-images-primary"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-medical-images-primary"
      Region = "Primary"
    }
  )
}

resource "aws_s3_bucket_versioning" "medical_images_primary" {
  bucket = aws_s3_bucket.medical_images_primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical_images_primary" {
  bucket = aws_s3_bucket.medical_images_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for medical images - Secondary Region
resource "aws_s3_bucket" "medical_images_secondary" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-medical-images-secondary"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-medical-images-secondary"
      Region = "Secondary"
    }
  )
}

resource "aws_s3_bucket_versioning" "medical_images_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.medical_images_secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical_images_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.medical_images_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.medical_images_primary.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.medical_images_primary.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.medical_images_secondary.arn}/*"
        ]
      }
    ]
  })
}

# S3 Replication Configuration
resource "aws_s3_bucket_replication_configuration" "medical_images" {
  depends_on = [aws_s3_bucket_versioning.medical_images_primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.medical_images_primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.medical_images_secondary.arn
      storage_class = "STANDARD_IA"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}

# ============================================================================
# ROUTE 53 HEALTH CHECKS AND FAILOVER
# ============================================================================

# Route 53 Health Check - Primary Region
resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-health-check-primary"
      Region = "Primary"
    }
  )
}

# Route 53 Health Check - Secondary Region
resource "aws_route53_health_check" "secondary" {
  fqdn              = aws_lb.secondary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-health-check-secondary"
      Region = "Secondary"
    }
  )
}

# CloudWatch Alarms for Health Checks
resource "aws_cloudwatch_metric_alarm" "primary_health" {
  alarm_name          = "${local.name_prefix}-primary-region-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Primary region health check failed"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "secondary_health" {
  alarm_name          = "${local.name_prefix}-secondary-region-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Secondary region health check failed"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.secondary.id
  }

  tags = local.common_tags
}

# SNS Topic for Failover Alerts
resource "aws_sns_topic" "failover_alerts" {
  name = "${local.name_prefix}-failover-alerts"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "failover_email" {
  topic_arn = aws_sns_topic.failover_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ============================================================================
# ELASTICACHE REPLICATION (Redis)
# ============================================================================

# ElastiCache Replication Group with Multi-AZ
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${local.name_prefix}-redis"
  replication_group_description = "Redis cluster for MedhaOS with multi-AZ"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.elasticache_node_type
  num_cache_clusters         = var.elasticache_num_cache_nodes
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.elasticache.id]
  
  automatic_failover_enabled = true
  multi_az_enabled           = var.enable_multi_az
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  
  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:05:00-mon:07:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-redis"
    }
  )
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${local.name_prefix}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "elasticache" {
  name              = "/aws/elasticache/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}
