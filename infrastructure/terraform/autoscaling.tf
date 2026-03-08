# Auto Scaling Configuration
# Automatically scales services based on CPU and request metrics

# ============================================
# Launch Template for API Gateway
# ============================================

resource "aws_launch_template" "api_gateway" {
  name_prefix   = "${local.name_prefix}-api-gateway-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.api_gateway_instance_type

  vpc_security_group_ids = [aws_security_group.api_gateway.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.api_gateway.name
  }

  user_data = base64encode(templatefile("${path.module}/user-data/api-gateway.sh", {
    environment = var.environment
    region      = var.aws_region
  }))

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      local.common_tags,
      {
        Name = "${local.name_prefix}-api-gateway"
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# Auto Scaling Group for API Gateway
# ============================================

resource "aws_autoscaling_group" "api_gateway" {
  name                = "${local.name_prefix}-api-gateway-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.api_gateway.arn]

  min_size         = var.api_gateway_min_size
  max_size         = var.api_gateway_max_size
  desired_capacity = var.api_gateway_desired_capacity

  health_check_type         = "ELB"
  health_check_grace_period = 300
  default_cooldown          = 300

  launch_template {
    id      = aws_launch_template.api_gateway.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances",
  ]

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-api-gateway"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# ============================================
# Auto Scaling Policies - Target Tracking
# ============================================

# Scale based on CPU utilization (target: 70%)
resource "aws_autoscaling_policy" "api_gateway_cpu" {
  name                   = "${local.name_prefix}-api-gateway-cpu-policy"
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 70.0
  }
}

# Scale based on ALB request count per target
resource "aws_autoscaling_policy" "api_gateway_request_count" {
  name                   = "${local.name_prefix}-api-gateway-request-policy"
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api_gateway.arn_suffix}"
    }

    target_value = 1000.0
  }
}

# ============================================
# Auto Scaling Policies - Step Scaling
# ============================================

# Scale up policy
resource "aws_autoscaling_policy" "api_gateway_scale_up" {
  name                   = "${local.name_prefix}-api-gateway-scale-up"
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"

  step_adjustment {
    scaling_adjustment          = 1
    metric_interval_lower_bound = 0
    metric_interval_upper_bound = 10
  }

  step_adjustment {
    scaling_adjustment          = 2
    metric_interval_lower_bound = 10
  }
}

# Scale down policy
resource "aws_autoscaling_policy" "api_gateway_scale_down" {
  name                   = "${local.name_prefix}-api-gateway-scale-down"
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"

  step_adjustment {
    scaling_adjustment          = -1
    metric_interval_upper_bound = 0
  }
}

# ============================================
# CloudWatch Alarms for Step Scaling
# ============================================

# High CPU alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_cpu_high" {
  alarm_name          = "${local.name_prefix}-api-gateway-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_gateway.name
  }

  alarm_description = "This metric monitors API Gateway CPU utilization"
  alarm_actions     = [aws_autoscaling_policy.api_gateway_scale_up.arn]

  tags = local.common_tags
}

# Low CPU alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_cpu_low" {
  alarm_name          = "${local.name_prefix}-api-gateway-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 30

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_gateway.name
  }

  alarm_description = "This metric monitors API Gateway CPU utilization"
  alarm_actions     = [aws_autoscaling_policy.api_gateway_scale_down.arn]

  tags = local.common_tags
}

# ============================================
# Scheduled Scaling (Optional)
# ============================================

# Scale up during business hours
resource "aws_autoscaling_schedule" "api_gateway_scale_up_business_hours" {
  count                  = var.enable_scheduled_scaling ? 1 : 0
  scheduled_action_name  = "${local.name_prefix}-scale-up-business-hours"
  min_size               = var.api_gateway_min_size
  max_size               = var.api_gateway_max_size
  desired_capacity       = var.api_gateway_desired_capacity + 2
  recurrence             = "0 6 * * MON-FRI" # 6 AM IST on weekdays
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
}

# Scale down after business hours
resource "aws_autoscaling_schedule" "api_gateway_scale_down_after_hours" {
  count                  = var.enable_scheduled_scaling ? 1 : 0
  scheduled_action_name  = "${local.name_prefix}-scale-down-after-hours"
  min_size               = var.api_gateway_min_size
  max_size               = var.api_gateway_max_size
  desired_capacity       = var.api_gateway_min_size
  recurrence             = "0 22 * * *" # 10 PM IST daily
  autoscaling_group_name = aws_autoscaling_group.api_gateway.name
}

# ============================================
# Security Group for API Gateway Instances
# ============================================

resource "aws_security_group" "api_gateway" {
  name        = "${local.name_prefix}-api-gateway-sg"
  description = "Security group for API Gateway instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from bastion"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.bastion_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-gateway-sg"
    }
  )
}

# ============================================
# IAM Role for API Gateway Instances
# ============================================

resource "aws_iam_role" "api_gateway" {
  name = "${local.name_prefix}-api-gateway-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_ssm" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "api_gateway" {
  name = "${local.name_prefix}-api-gateway-profile"
  role = aws_iam_role.api_gateway.name

  tags = local.common_tags
}

# ============================================
# Data Sources
# ============================================

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================
# Outputs
# ============================================

output "api_gateway_asg_name" {
  description = "Name of the API Gateway Auto Scaling Group"
  value       = aws_autoscaling_group.api_gateway.name
}

output "api_gateway_asg_arn" {
  description = "ARN of the API Gateway Auto Scaling Group"
  value       = aws_autoscaling_group.api_gateway.arn
}
