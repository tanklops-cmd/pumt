import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import auditRoutes from './routes/audit';
import authRoutes from './routes/auth';
import dataRoutes from './routes/data';
import briefingRoutes from './routes/briefings';
import requestRoutes from './routes/requests';
import recordRoutes from './routes/record';
import { initWebSocket } from './ws';
import { dataSource } from './db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

dataSource.initialize()
  .then(() => console.log('Database connected (SQL.js)'))
  .catch((err) => console.error('Database connection error:', err));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/screenshots', express.static(path.join(process.cwd(), 'screenshots')));

// API routes MUST come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/briefings', briefingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/record', recordRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production (after API routes)
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// Serve frontend for root path only (Cloudflare Tunnel handles the rest)
app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

// Initialize WebSocket
initWebSocket(server);
