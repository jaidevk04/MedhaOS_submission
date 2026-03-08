#!/bin/bash
# User data script for API Gateway instances
# Installs and configures the API Gateway service

set -e

# Update system
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "metrics": {
    "namespace": "MedhaOS/${environment}",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/api-gateway/*.log",
            "log_group_name": "/medhaos/${environment}/api-gateway",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Create application directory
mkdir -p /opt/medhaos/api-gateway
mkdir -p /var/log/api-gateway

# Create systemd service
cat > /etc/systemd/system/api-gateway.service <<EOF
[Unit]
Description=MedhaOS API Gateway
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/medhaos/api-gateway
Environment="NODE_ENV=${environment}"
Environment="AWS_REGION=${region}"
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/api-gateway/output.log
StandardError=append:/var/log/api-gateway/error.log

[Install]
WantedBy=multi-user.target
EOF

# Enable service (will start after deployment)
systemctl daemon-reload
systemctl enable api-gateway

# Install health check script
cat > /usr/local/bin/health-check.sh <<'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$response" = "200" ]; then
  exit 0
else
  exit 1
fi
EOF

chmod +x /usr/local/bin/health-check.sh

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${region} || true

echo "API Gateway instance setup complete"
