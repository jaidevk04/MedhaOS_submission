# Load and Stress Testing

This directory contains load and stress tests for the MedhaOS Healthcare Intelligence Ecosystem.

## Test Structure

- `jmeter/` - JMeter test plans and scenarios
- `k6/` - K6 load testing scripts (alternative to JMeter)
- `scenarios/` - Test scenario definitions
- `results/` - Test results and reports

## Test Scenarios

### 1. Normal Load (Baseline)
- 1,000 concurrent users
- 30-minute duration
- Simulates typical daily operations

### 2. Peak Load
- 5,000 concurrent users
- 1-hour duration
- Simulates peak hospital hours

### 3. Stress Test
- 10,000 concurrent users
- 30-minute duration
- Tests system limits

### 4. Spike Test
- Sudden increase from 1,000 to 10,000 users
- 15-minute duration
- Tests auto-scaling response

### 5. Endurance Test (Soak Test)
- 2,000 concurrent users
- 24-hour duration
- Tests for memory leaks and degradation

## Running Tests

### JMeter Tests
```bash
# Run normal load test
jmeter -n -t jmeter/normal-load.jmx -l results/normal-load.jtl -e -o results/normal-load-report

# Run stress test
jmeter -n -t jmeter/stress-test.jmx -l results/stress-test.jtl -e -o results/stress-test-report

# Run with distributed testing
jmeter -n -t jmeter/stress-test.jmx -R server1,server2,server3 -l results/distributed.jtl
```

### K6 Tests
```bash
# Run normal load test
k6 run k6/normal-load.js

# Run stress test
k6 run k6/stress-test.js

# Run with cloud execution
k6 cloud k6/stress-test.js
```

## Performance Requirements

Based on requirements 18.1, 18.2, 18.3:

- **Response Time**: < 3 seconds for 95% of requests
- **Throughput**: Support 10,000 concurrent users
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% under normal load
- **Auto-scaling**: Scale within 2 minutes of load increase

## Monitoring During Tests

Monitor these metrics during load tests:
- API response times (P50, P95, P99)
- Error rates
- CPU and memory utilization
- Database connection pool usage
- Cache hit rates
- Network throughput
- Auto-scaling events

## Prerequisites

### JMeter
```bash
# Install JMeter
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.2.tgz
tar -xzf apache-jmeter-5.6.2.tgz
export PATH=$PATH:$(pwd)/apache-jmeter-5.6.2/bin
```

### K6
```bash
# Install K6
brew install k6  # macOS
# or
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Data

Load tests use generated test data to simulate realistic scenarios. Each virtual user has unique credentials and patient data.

## Results Analysis

After running tests, analyze:
1. Response time percentiles (P50, P95, P99)
2. Throughput (requests per second)
3. Error rate and types
4. Resource utilization trends
5. Bottlenecks and performance issues
6. Auto-scaling effectiveness
