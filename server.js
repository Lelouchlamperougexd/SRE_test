const express = require('express');
const app = express();
const client = require('prom-client');

// Create a Registry to register metrics
const Registry = client.Registry;
const register = new Registry();

// Add default metrics (process metrics like CPU, memory usage)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register });

// HTTP request counter by status code and method
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code', 'route'],
  registers: [register]
});

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 3, 5, 10], // in seconds
  registers: [register]
});

// Error counter
const errorCounter = new client.Counter({
  name: 'app_errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
  registers: [register]
});

// Request size
const requestSizeBytes = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register]
});

// Response size
const responseSizeBytes = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register]
});

// Middleware to measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  
  // Record request size
  if (req.headers['content-length']) {
    requestSizeBytes.observe({ 
      method: req.method, 
      route: req.originalUrl 
    }, parseInt(req.headers['content-length']));
  }
  
  // Record response metrics on finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // in seconds
    
    httpRequestsTotal.inc({ 
      method: req.method, 
      status_code: res.statusCode, 
      route: req.originalUrl 
    });
    
    httpRequestDurationMicroseconds.observe({ 
      method: req.method, 
      route: req.originalUrl, 
      status_code: res.statusCode 
    }, duration);
    
    // Record response size
    if (res.getHeader('content-length')) {
      responseSizeBytes.observe({
        method: req.method,
        route: req.originalUrl
      }, parseInt(res.getHeader('content-length')));
    }
  });
  
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  errorCounter.inc({ type: err.name || 'unknown' });
  next(err);
});

// /metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Root endpoint
app.get('/', (req, res) => {
  // Simulate random response time
  setTimeout(() => {
    res.json({ "message": "Hello, server! This is JSON data from the API." });
  }, Math.random() * 100);
});

// Simulate error endpoint
app.get('/error', (req, res) => {
  try {
    // Simulate random errors
    if (Math.random() > 0.7) {
      throw new Error('Simulated error');
    }
    res.json({ "message": "No error occurred" });
  } catch (err) {
    errorCounter.inc({ type: err.name });
    res.status(500).json({ "error": "Something went wrong" });
  }
});

// Simulate slow endpoint
app.get('/slow', (req, res) => {
  // Simulate varying response time from 200ms to 1s
  setTimeout(() => {
    res.json({ "message": "This was a slow response" });
  }, 200 + Math.random() * 800);
});

// Server health check
app.get('/health', (req, res) => {
  res.status(200).json({ "status": "UP" });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  errorCounter.inc({ type: 'uncaughtException' });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  errorCounter.inc({ type: 'unhandledRejection' });
});