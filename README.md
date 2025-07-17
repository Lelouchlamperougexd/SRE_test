Express.js Monitoring Stack
A complete monitoring solution for Express.js applications using Prometheus, Alertmanager, and Grafana with Docker Compose.
Architecture
This monitoring stack consists of:

Express.js Application - Sample web server with Prometheus metrics
Prometheus - Metrics collection and alerting
Alertmanager - Alert routing and notifications
Grafana - Visualization and dashboards

Features
Application Metrics

HTTP request count by method, status code, and route
Request duration histograms
Request/response size tracking
Error counters with categorization
Default process metrics (CPU, memory usage)

Monitoring Alerts

High response time (95th percentile > 300ms)
High error rate (>1% 5xx errors)
Low throughput (<1 request/second)
High CPU usage (>80%)
High memory usage (>1.5GB)

Endpoints

/ - Main API endpoint with simulated response times
/error - Endpoint that randomly generates errors (30% chance)
/slow - Endpoint with variable response times (200ms-1s)
/health - Health check endpoint
/metrics - Prometheus metrics endpoint

Quick Start
Prerequisites

Docker and Docker Compose installed
Node.js 18+ (for local development)

1. Clone and Setup
bashgit clone <repository-url>
cd monitoring-stack
2. Configure Email Notifications
Edit alertmanager/alertmanager.yml and replace the email configuration:
yamlreceivers:
- name: 'email-notifications'
  email_configs:
  - to: 'your-email@example.com'
    from: 'alertmanager@example.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'your-email@example.com'
    auth_identity: 'your-email@example.com'
    auth_password: 'your-password'
3. Start the Stack
bashdocker-compose up -d
4. Access the Services

Express App: http://localhost:8080
Prometheus: http://localhost:9090
Alertmanager: http://localhost:9093
Grafana: http://localhost:3000 (admin/admin)

Service Configuration
Express Application
The application automatically instruments itself with Prometheus metrics:

Collects default process metrics
Tracks HTTP requests, duration, and size
Monitors errors and exceptions
Exposes metrics at /metrics endpoint

Prometheus

Scrapes metrics from Express app every 15 seconds
Evaluates alert rules every 15 seconds
Configured to send alerts to Alertmanager
Data stored in prometheus_data volume

Alertmanager

Groups alerts by alert name
10-second wait before sending grouped alerts
1-hour repeat interval for unresolved alerts
Email notifications for all alerts

Grafana

Pre-configured with admin/admin credentials
Data stored in grafana_data volume
Ready to connect to Prometheus data source

Monitoring Setup
1. Configure Grafana Data Source

Access Grafana at http://localhost:3000
Login with admin/admin
Add Prometheus data source: http://prometheus:9090
Test connection and save

2. Create Dashboards
Import or create dashboards to visualize:

Request rate and response times
Error rates and status codes
CPU and memory usage
Alert status

3. Test Alerts
Generate load to trigger alerts:
bash# Generate high load
for i in {1..100}; do curl http://localhost:8080/ & done

# Generate errors
for i in {1..50}; do curl http://localhost:8080/error & done

# Test slow responses
curl http://localhost:8080/slow
Alert Rules
High Response Time

Condition: 95th percentile > 300ms for 1 minute
Severity: Warning

High Error Rate

Condition: 5xx error rate > 1% for 1 minute
Severity: Critical

Low Throughput

Condition: < 1 request/second for 5 minutes
Severity: Warning

High CPU Usage

Condition: > 80% CPU for 5 minutes
Severity: Warning

High Memory Usage

Condition: > 1.5GB memory for 5 minutes
Severity: Warning

Customization
Adding New Metrics
Edit server.js to add custom metrics:
javascriptconst customMetric = new client.Counter({
  name: 'custom_metric_total',
  help: 'Description of custom metric',
  labelNames: ['label1', 'label2'],
  registers: [register]
});
Adding New Alerts
Edit prometheus/alert_rules.yml:
yaml- alert: CustomAlert
  expr: custom_metric_total > 10
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert triggered"
    description: "Custom metric exceeded threshold"
Modifying Alertmanager
Edit alertmanager/alertmanager.yml to:

Add Slack/Discord notifications
Configure routing rules
Set up inhibition rules

Development
Local Development
bash# Install dependencies
npm install

# Run application locally
npm start

# Application will be available at http://localhost:8080
Building Docker Image
bashdocker build -t express-monitoring .
Persistence
Data is persisted in Docker volumes:

prometheus_data - Prometheus metrics and configuration
grafana_data - Grafana dashboards and settings

Troubleshooting
Common Issues

Prometheus can't scrape metrics

Check network connectivity: docker network ls
Verify Express app is running: curl http://localhost:8080/metrics


Alerts not firing

Check Prometheus targets: http://localhost:9090/targets
Verify alert rules: http://localhost:9090/rules


Email notifications not working

Check Alertmanager logs: docker-compose logs alertmanager
Verify SMTP configuration in alertmanager.yml


High resource usage

Adjust scrape intervals in prometheus.yml
Configure retention policies



Logs
bash# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f prometheus
docker-compose logs -f alertmanager
docker-compose logs -f grafana
docker-compose logs -f express-app
Security Considerations

Change default Grafana password
Use environment variables for sensitive data
Configure proper network security
Enable authentication for Prometheus/Alertmanager in production
Use TLS certificates for HTTPS

Scaling
For production environments:

Use external data stores (PostgreSQL for Grafana)
Implement Prometheus high availability
Configure load balancing
Set up proper backup strategies
Use secrets management
