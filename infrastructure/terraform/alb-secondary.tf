# Application Load Balancer - Secondary Region

# Security Group for ALB - Secondary Region
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-alb-sg-secondary"
  description = "Security group for Application Load Balancer in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-alb-sg-secondary"
      Region = "Secondary"
    }
  )
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${local.name_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = var.environment == "production"
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs_secondary.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-alb-secondary"
      Region = "Secondary"
    }
  )
}

# S3 Bucket for ALB Access Logs - Secondary Region
resource "aws_s3_bucket" "alb_logs_secondary" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-alb-logs-secondary"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-alb-logs-secondary"
      Region = "Secondary"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.alb_logs_secondary.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "alb_logs_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.alb_logs_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.secondary.id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs_secondary.arn}/*"
      }
    ]
  })
}

data "aws_elb_service_account" "secondary" {
  provider = aws.secondary
}

# Target Group for API Gateway - Secondary Region
resource "aws_lb_target_group" "api_gateway_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-api-tg-secondary"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-api-tg-secondary"
      Region = "Secondary"
    }
  )
}

# HTTPS Listener - Secondary Region
resource "aws_lb_listener" "https_secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.secondary.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway_secondary.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-https-listener-secondary"
      Region = "Secondary"
    }
  )
}

# HTTP Listener (redirect to HTTPS) - Secondary Region
resource "aws_lb_listener" "http_secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-http-listener-secondary"
      Region = "Secondary"
    }
  )
}

# ACM Certificate - Secondary Region
resource "aws_acm_certificate" "secondary" {
  provider          = aws.secondary
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "admin.${var.domain_name}",
    "clinician.${var.domain_name}",
    "public-health.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-cert-secondary"
      Region = "Secondary"
    }
  )
}

# CloudWatch Alarms for ALB - Secondary Region
resource "aws_cloudwatch_metric_alarm" "alb_target_health_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-alb-unhealthy-targets-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "ALB has no healthy targets in secondary region"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.api_gateway_secondary.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-alb-high-response-time-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 3
  alarm_description   = "ALB response time is high in secondary region"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-alb-5xx-errors-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is receiving too many 5XX errors in secondary region"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
  }

  tags = local.common_tags
}
