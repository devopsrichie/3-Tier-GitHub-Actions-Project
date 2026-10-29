const express = require('express');
const cors = require('cors');
const client = require('prom-client');

const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const userRoutes = require('./routes/users');

const app = express();

// ---- Prometheus metrics ----
client.collectDefaultMetrics({ prefix: 'auction_api_' });
const httpRequests = new client.Counter({
  name: 'auction_api_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : 'unmatched';
    httpRequests.inc({ method: req.method, route, status: res.statusCode });
  });
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Internal server error' });
});

module.exports = app;
