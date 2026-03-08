# MedhaOS Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered in the MedhaOS Healthcare Intelligence Ecosystem. Use this as a first reference when diagnosing problems.

**Last Updated:** February 26, 2026  
**Version:** 1.0.0

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Application Issues](#application-issues)
3. [Database Issues](#database-issues)
4. [AI Agent Issues](#ai-agent-issues)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)
7. [Integration Issues](#integration-issues)
8. [Infrastructure Issues](#infrastructure-issues)

---

## Quick Diagnostics

### System Health Check

Run this script to get overall system status:

```bash
#!/bin/bash
# health-check.sh

echo "=== MedhaOS Health Check ==="
echo ""

# Check Kubernetes cluster
echo "1. Kubernetes Cluster Status:"
kubectl cluster-info
echo ""

# Check pods
echo "2. Pod Status:"
kubectl get pods -n medhaos-prod | grep -v Running
echo ""

# Check services
echo "3. Service Status:"
kubectl get svc -n medhaos-prod
echo ""

# Check database
echo "4. Database Connectivity:"
kubectl run -it --rm db-test --image=postgres:15 --restart=Never -- \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"
echo ""

# Check API Gateway
echo "5. API Gateway Health:"
curl -s https://api.medhaos.health/health | jq
echo ""

# Check Redis
echo "6. Redis Connectivity:"
kubectl run -it --rm redis-test --image=redis:7 --restart=Never -- \
  redis-cli -h $REDIS_HOST ping
echo ""

echo "=== Health Check Complete ==="
```

---

## Application Issues

### Issue: API Gateway Not Responding

**Symptoms:**
- 502 Bad Gateway errors
- Connection timeout
- No response from API

**Diagnosis:**
```bash
# Check API Gateway pods
kubectl get pods -n medhaos-prod -l app=api-gateway

# View logs
kubectl logs -f deployment/api-gateway -n medhaos-prod --tail=100

# Check service
kubectl describe svc api-gateway -n medhaos-prod
```

**Solutions:**

1. **Restart API Gateway:**
```bash
kubectl rollout restart deployment/api-gateway -n medhaos-prod
```

2. **Scale up pods:**
```bash
kubectl scale deployment/api-gateway --replicas=5 -n medhaos-prod
```

3. **Check resource limits:**
```bash
kubectl describe pod <api-gateway-pod> -n medhaos-prod | grep -A 5 "Limits"
```

4. **Verify environment variables:**
```bash
kubectl exec -it deployment/api-gateway -n medhaos-prod -- env | grep -E "DB_|REDIS_|JWT_"
```

### Issue: Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- Invalid token errors
- Login failures

**Diagnosis:**
```bash
# Check auth service logs
kubectl logs -f deployment/auth-service -n medhaos-prod | grep ERROR

# Test token generation
curl -X POST https://api.medhaos.health/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"test@medhaos.health","password":"test123"}' -v
```

**Solutions:**

1. **Verify JWT secret:**
```bash
kubectl get secret medhaos-secrets -n medhaos-prod -o jsonpath='{.data.JWT_SECRET}' | base64 -d
```

2. **Check token expiry:**
```bash
# Decode JWT token
echo "<token>" | cut -d'.' -f2 | base64 -d | jq
```

3. **Restart auth service:**
```bash
kubectl rollout restart deployment/auth-service -n medhaos-prod
```

4. **Clear Redis cache:**
```bash
kubectl exec -it deployment/auth-service -n medhaos-prod -- \
  redis-cli -h $REDIS_HOST FLUSHDB
```

### Issue: Slow API Responses

**Symptoms:**
- Response times > 5 seconds
- Timeout errors
- High latency

**Diagnosis:**
```bash
# Check pod CPU/memory
kubectl top pods -n medhaos-prod

# Check HPA status
kubectl get hpa -n medhaos-prod

# View slow queries
kubectl logs deployment/api-gateway -n medhaos-prod | grep "duration" | sort -k3 -n | tail -20
```

**Solutions:**

1. **Enable caching:**
```bash
# Verify Redis is working
kubectl exec -it deployment/api-gateway -n medhaos-prod -- \
  redis-cli -h $REDIS_HOST INFO stats
```

2. **Optimize database queries:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

3. **Scale horizontally:**
```bash
kubectl scale deployment/api-gateway --replicas=10 -n medhaos-prod
```

4. **Increase resource limits:**
```yaml
# Update values.yaml
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi
```

---

## Database Issues

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Connection timeout
- Services unable to connect

**Diagnosis:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SHOW max_connections;

-- View active connections by application
SELECT application_name, count(*)
FROM pg_stat_activity
GROUP BY application_name;
```

**Solutions:**

1. **Increase connection pool size:**
```javascript
// In database configuration
const pool = new Pool({
  max: 20, // Increase from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

2. **Kill idle connections:**
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '10 minutes';
```

3. **Upgrade RDS instance:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier medhaos-prod \
  --db-instance-class db.r6g.xlarge \
  --apply-immediately
```

### Issue: Slow Database Queries

**Symptoms:**
- Query execution time > 1 second
- Database CPU at 100%
- Application timeouts

**Diagnosis:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;
```

**Solutions:**

1. **Create missing indexes:**
```sql
-- Example: Index on patient_id
CREATE INDEX CONCURRENTLY idx_encounters_patient_id
ON clinical_encounters(patient_id);

-- Composite index
CREATE INDEX CONCURRENTLY idx_appointments_facility_datetime
ON appointments(facility_id, scheduled_datetime);
```

2. **Analyze tables:**
```sql
ANALYZE VERBOSE patients;
ANALYZE VERBOSE clinical_encounters;
```

3. **Vacuum tables:**
```sql
VACUUM ANALYZE patients;
VACUUM ANALYZE clinical_encounters;
```

4. **Enable query plan caching:**
```sql
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
```

### Issue: Database Replication Lag

**Symptoms:**
- Read replicas showing stale data
- Replication lag > 5 seconds
- Data inconsistency

**Diagnosis:**
```sql
-- Check replication lag
SELECT
  client_addr,
  state,
  sync_state,
  replay_lag
FROM pg_stat_replication;
```

**Solutions:**

1. **Increase WAL sender processes:**
```sql
ALTER SYSTEM SET max_wal_senders = 10;
SELECT pg_reload_conf();
```

2. **Optimize network:**
```bash
# Check network latency
ping <replica-endpoint>
```

3. **Promote replica if needed:**
```bash
aws rds promote-read-replica \
  --db-instance-identifier medhaos-prod-replica-1
```

---

## AI Agent Issues

### Issue: Triage Agent Not Responding

**Symptoms:**
- Triage requests timing out
- No urgency score returned
- 500 Internal Server Error

**Diagnosis:**
```bash
# Check triage agent logs
kubectl logs -f deployment/triage-agent -n medhaos-prod | grep ERROR

# Check model loading
kubectl logs deployment/triage-agent -n medhaos-prod | grep "Model loaded"

# Test directly
kubectl exec -it deployment/triage-agent -n medhaos-prod -- \
  curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms":["chest pain"],"vitals":{"bp":"145/92"}}'
```

**Solutions:**

1. **Restart agent:**
```bash
kubectl rollout restart deployment/triage-agent -n medhaos-prod
```

2. **Check model file:**
```bash
kubectl exec -it deployment/triage-agent -n medhaos-prod -- \
  ls -lh /app/models/
```

3. **Increase memory:**
```yaml
resources:
  limits:
    memory: 8Gi  # Increase for model loading
```

4. **Reload model:**
```bash
kubectl exec -it deployment/triage-agent -n medhaos-prod -- \
  python -c "from src.model import load_model; load_model()"
```

### Issue: Low AI Confidence Scores

**Symptoms:**
- Confidence scores < 0.70
- Frequent human escalations
- Inconsistent predictions

**Diagnosis:**
```bash
# Check recent predictions
kubectl logs deployment/triage-agent -n medhaos-prod | grep "confidence" | tail -50

# Analyze confidence distribution
kubectl logs deployment/triage-agent -n medhaos-prod | \
  grep "confidence" | \
  awk '{print $NF}' | \
  sort -n | \
  uniq -c
```

**Solutions:**

1. **Retrain model with more data:**
```bash
cd services/triage-agent
python scripts/train_model.py --data-size 1000000
```

2. **Adjust confidence threshold:**
```python
# In agent configuration
CONFIDENCE_THRESHOLD = 0.75  # Lower from 0.85
```

3. **Enable ensemble predictions:**
```python
# Use multiple models
predictions = [
    model1.predict(features),
    model2.predict(features),
    model3.predict(features)
]
final_prediction = np.mean(predictions)
```

### Issue: Ambient Scribe Transcription Errors

**Symptoms:**
- Incorrect transcription
- Missing words
- Wrong speaker labels

**Diagnosis:**
```bash
# Check ambient scribe logs
kubectl logs -f deployment/ambient-scribe-agent -n medhaos-prod

# Test audio processing
kubectl exec -it deployment/ambient-scribe-agent -n medhaos-prod -- \
  python -c "from src.transcribe import test_audio; test_audio()"
```

**Solutions:**

1. **Verify Bhashini API:**
```bash
curl -X POST https://bhashini.gov.in/api/v1/transcribe \
  -H "Authorization: Bearer $BHASHINI_API_KEY" \
  -F "audio=@test.wav"
```

2. **Adjust audio quality settings:**
```python
# In transcription config
SAMPLE_RATE = 16000  # Increase from 8000
CHANNELS = 1
BIT_DEPTH = 16
```

3. **Improve speaker diarization:**
```python
# Use better diarization model
from pyannote.audio import Pipeline
pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
```

---

## Performance Issues

### Issue: High CPU Usage

**Symptoms:**
- CPU usage > 80%
- Slow response times
- Pod throttling

**Diagnosis:**
```bash
# Check CPU usage
kubectl top pods -n medhaos-prod --sort-by=cpu

# View CPU metrics
kubectl describe node <node-name> | grep -A 5 "Allocated resources"

# Profile application
kubectl exec -it deployment/api-gateway -n medhaos-prod -- \
  node --prof index.js
```

**Solutions:**

1. **Scale horizontally:**
```bash
kubectl scale deployment/api-gateway --replicas=10 -n medhaos-prod
```

2. **Optimize code:**
```javascript
// Use caching
const cache = new Map();
function expensiveOperation(key) {
  if (cache.has(key)) return cache.get(key);
  const result = doExpensiveWork(key);
  cache.set(key, result);
  return result;
}
```

3. **Enable cluster autoscaler:**
```yaml
# cluster-autoscaler.yaml
spec:
  minReplicas: 5
  maxReplicas: 50
```

### Issue: High Memory Usage

**Symptoms:**
- Memory usage > 90%
- OOMKilled pods
- Memory leaks

**Diagnosis:**
```bash
# Check memory usage
kubectl top pods -n medhaos-prod --sort-by=memory

# View memory metrics
kubectl describe pod <pod-name> -n medhaos-prod | grep -A 10 "Limits"

# Check for memory leaks
kubectl exec -it deployment/api-gateway -n medhaos-prod -- \
  node --inspect index.js
```

**Solutions:**

1. **Increase memory limits:**
```yaml
resources:
  limits:
    memory: 4Gi
  requests:
    memory: 2Gi
```

2. **Fix memory leaks:**
```javascript
// Clear event listeners
emitter.removeAllListeners();

// Clear intervals
clearInterval(intervalId);

// Null references
largeObject = null;
```

3. **Enable garbage collection:**
```javascript
// In Node.js
node --max-old-space-size=4096 --expose-gc index.js
```

### Issue: Database Connection Leaks

**Symptoms:**
- Increasing connection count
- "Too many connections" errors
- Memory growth

**Diagnosis:**
```sql
-- Check long-running connections
SELECT pid, usename, application_name, state, state_change
FROM pg_stat_activity
WHERE state != 'idle'
AND state_change < NOW() - INTERVAL '5 minutes';
```

**Solutions:**

1. **Use connection pooling:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always release connections
const client = await pool.connect();
try {
  await client.query('SELECT * FROM patients');
} finally {
  client.release();
}
```

2. **Set connection timeout:**
```javascript
const pool = new Pool({
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
```

---

## Security Issues

### Issue: Unauthorized Access Attempts

**Symptoms:**
- Multiple 401 errors
- Failed login attempts
- Suspicious API calls

**Diagnosis:**
```bash
# Check auth logs
kubectl logs deployment/auth-service -n medhaos-prod | grep "Failed login"

# View CloudWatch logs
aws logs filter-log-events \
  --log-group-name /aws/eks/medhaos-prod-cluster/cluster \
  --filter-pattern "401"
```

**Solutions:**

1. **Enable rate limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

2. **Block suspicious IPs:**
```bash
# Add to security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --ip-permissions IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=<malicious-ip>/32,Description="Blocked"}]'
```

3. **Enable MFA:**
```javascript
// Require MFA for sensitive operations
if (!user.mfaEnabled) {
  return res.status(403).json({ error: 'MFA required' });
}
```

### Issue: SSL Certificate Expired

**Symptoms:**
- SSL certificate warnings
- HTTPS connection failures
- Browser security errors

**Diagnosis:**
```bash
# Check certificate expiry
kubectl get certificate -n medhaos-prod
kubectl describe certificate medhaos-tls -n medhaos-prod

# Test SSL
openssl s_client -connect api.medhaos.health:443 -servername api.medhaos.health
```

**Solutions:**

1. **Renew certificate:**
```bash
# Using cert-manager
kubectl delete certificate medhaos-tls -n medhaos-prod
kubectl apply -f infrastructure/kubernetes/certificate.yaml
```

2. **Manual renewal:**
```bash
# Using Let's Encrypt
certbot renew --force-renewal
```

---

## Integration Issues

### Issue: ABDM Integration Failure

**Symptoms:**
- Unable to retrieve ABHA records
- Authentication failures
- Timeout errors

**Diagnosis:**
```bash
# Check integration service logs
kubectl logs -f deployment/integration-service -n medhaos-prod | grep ABDM

# Test ABDM API
curl -X POST https://healthidsbx.abdm.gov.in/api/v1/auth/init \
  -H "Content-Type: application/json" \
  -d '{"authMethod":"AADHAAR_OTP","healthid":"<abha-id>"}'
```

**Solutions:**

1. **Verify API credentials:**
```bash
kubectl get secret medhaos-secrets -n medhaos-prod -o jsonpath='{.data.ABDM_CLIENT_ID}' | base64 -d
```

2. **Refresh access token:**
```bash
curl -X POST https://healthidsbx.abdm.gov.in/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<client-id>","clientSecret":"<client-secret>"}'
```

3. **Implement retry logic:**
```javascript
async function fetchABDMRecord(abhaId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await abdmClient.getRecord(abhaId);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

### Issue: Bhashini API Errors

**Symptoms:**
- Speech-to-text failures
- Translation errors
- API quota exceeded

**Diagnosis:**
```bash
# Check Bhashini logs
kubectl logs deployment/speech-nlp-service -n medhaos-prod | grep Bhashini

# Test API
curl -X POST https://bhashini.gov.in/api/v1/transcribe \
  -H "Authorization: Bearer $BHASHINI_API_KEY" \
  -F "audio=@test.wav" \
  -F "language=hi"
```

**Solutions:**

1. **Check API quota:**
```bash
curl -X GET https://bhashini.gov.in/api/v1/quota \
  -H "Authorization: Bearer $BHASHINI_API_KEY"
```

2. **Implement fallback:**
```javascript
async function transcribe(audio, language) {
  try {
    return await bhashiniClient.transcribe(audio, language);
  } catch (error) {
    // Fallback to AWS Transcribe
    return await awsTranscribe.transcribe(audio, language);
  }
}
```

---

## Infrastructure Issues

### Issue: EKS Cluster Unreachable

**Symptoms:**
- kubectl commands failing
- Unable to connect to cluster
- API server timeout

**Diagnosis:**
```bash
# Check cluster status
aws eks describe-cluster --name medhaos-prod-cluster --query 'cluster.status'

# Test API server
curl -k https://<api-server-endpoint>/healthz
```

**Solutions:**

1. **Update kubeconfig:**
```bash
aws eks update-kubeconfig --region ap-south-1 --name medhaos-prod-cluster
```

2. **Check security groups:**
```bash
aws ec2 describe-security-groups --group-ids <cluster-sg-id>
```

3. **Verify IAM permissions:**
```bash
aws sts get-caller-identity
aws eks list-clusters
```

### Issue: Node Not Ready

**Symptoms:**
- Nodes in NotReady state
- Pods not scheduling
- Cluster capacity issues

**Diagnosis:**
```bash
# Check node status
kubectl get nodes

# Describe node
kubectl describe node <node-name>

# Check node logs
aws ec2 get-console-output --instance-id <instance-id>
```

**Solutions:**

1. **Restart kubelet:**
```bash
# SSH to node
ssh ec2-user@<node-ip>
sudo systemctl restart kubelet
```

2. **Drain and delete node:**
```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
kubectl delete node <node-name>
```

3. **Scale node group:**
```bash
aws eks update-nodegroup-config \
  --cluster-name medhaos-prod-cluster \
  --nodegroup-name medhaos-prod-nodes \
  --scaling-config minSize=5,maxSize=20,desiredSize=10
```

---

## Emergency Procedures

### Complete System Outage

1. **Check AWS Status:**
   - Visit https://status.aws.amazon.com
   - Check ap-south-1 region status

2. **Failover to Secondary Region:**
```bash
# Execute failover script
./infrastructure/disaster-recovery/scripts/failover-to-secondary.sh
```

3. **Notify Stakeholders:**
```bash
# Send alert
aws sns publish \
  --topic-arn arn:aws:sns:ap-south-1:123456789012:medhaos-alerts \
  --message "System outage detected. Failover initiated."
```

4. **Monitor Recovery:**
```bash
# Watch health checks
watch -n 5 'curl -s https://api.medhaos.health/health | jq'
```

---

## Getting Help

### Support Channels

**Slack:**
- #medhaos-support (General support)
- #medhaos-devops (Infrastructure issues)
- #medhaos-database (Database issues)
- #medhaos-security (Security issues)

**Email:**
- support@medhaos.health (General)
- devops@medhaos.health (Infrastructure)
- dba@medhaos.health (Database)

**On-Call:**
- Phone: +91-XXXX-XXXX
- PagerDuty: https://medhaos.pagerduty.com

### Escalation Path

1. **Level 1:** On-call engineer
2. **Level 2:** Team lead
3. **Level 3:** Engineering manager
4. **Level 4:** CTO

---

**Document Version:** 1.0.0  
**Last Updated:** February 26, 2026  
**Maintained By:** MedhaOS DevOps Team
