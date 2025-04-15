const express = require('express');
const app = express();
const client = require('prom-client');

// Создаем метрику
const counter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
});

// /metrics эндпоинт для Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Пример эндпоинта для данных
app.get('/', (req, res) => {
    counter.inc(); // Увеличивает счетчик при каждом запросе
    res.json({ "Message": "Hello, server! This is JSON data from Postman." });
});

// Запуск сервера
app.listen(8080, () => console.log('Server running on port 8080'));
