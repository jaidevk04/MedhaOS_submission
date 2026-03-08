# Route 53 DNS Configuration with Failover

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-hosted-zone"
    }
  )
}

# Primary Region - API Gateway
resource "aws_route53_record" "api_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Secondary Region - API Gateway (Failover)
resource "aws_route53_record" "api_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# Primary Region - Admin Dashboard
resource "aws_route53_record" "admin_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "admin.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Secondary Region - Admin Dashboard (Failover)
resource "aws_route53_record" "admin_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "admin.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# Primary Region - Clinician Terminal
resource "aws_route53_record" "clinician_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "clinician.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Secondary Region - Clinician Terminal (Failover)
resource "aws_route53_record" "clinician_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "clinician.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# Primary Region - Public Health Dashboard
resource "aws_route53_record" "public_health_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "public-health.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Secondary Region - Public Health Dashboard (Failover)
resource "aws_route53_record" "public_health_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "public-health.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# Geolocation Routing for Optimal Performance
# Route Indian traffic to closest region
resource "aws_route53_record" "api_geo_india" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api-geo.${var.domain_name}"
  type    = "A"

  set_identifier = "india-mumbai"
  geolocation_routing_policy {
    country = "IN"
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Default geolocation record (for non-Indian traffic)
resource "aws_route53_record" "api_geo_default" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api-geo.${var.domain_name}"
  type    = "A"

  set_identifier = "default"
  geolocation_routing_policy {
    country = "*"
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# ACM Certificate Validation Records - Primary Region
resource "aws_route53_record" "cert_validation_primary" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# ACM Certificate Validation Records - Secondary Region
resource "aws_route53_record" "cert_validation_secondary" {
  for_each = {
    for dvo in aws_acm_certificate.secondary.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# ACM Certificate Validation - Primary Region
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation_primary : record.fqdn]
}

# ACM Certificate Validation - Secondary Region
resource "aws_acm_certificate_validation" "secondary" {
  provider                = aws.secondary
  certificate_arn         = aws_acm_certificate.secondary.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation_secondary : record.fqdn]
}

# CloudWatch Metric for DNS Query Count
resource "aws_cloudwatch_log_metric_filter" "dns_queries" {
  name           = "${local.name_prefix}-dns-queries"
  log_group_name = "/aws/route53/${aws_route53_zone.main.name}"
  pattern        = "[...]"

  metric_transformation {
    name      = "DNSQueryCount"
    namespace = "MedhaOS/Route53"
    value     = "1"
  }
}

# CloudWatch Alarm for DNS Query Anomalies
resource "aws_cloudwatch_metric_alarm" "dns_query_anomaly" {
  alarm_name          = "${local.name_prefix}-dns-query-anomaly"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DNSQueryCount"
  namespace           = "MedhaOS/Route53"
  period              = 300
  statistic           = "Sum"
  threshold           = 10000
  alarm_description   = "Unusual spike in DNS queries detected"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  tags = local.common_tags
}
