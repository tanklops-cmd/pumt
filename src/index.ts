import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DataSource } from 'typeorm';
import { AuditRecord } from './entity/AuditRecord';
import auditRoutes from './routes/audit';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const dataSource = new DataSource({
  type: 'sqljs',
  location: 'prison_muster.sql',
  autoSave: true,
  entities: [AuditRecord],
});

dataSource.initialize()
  .then(() => console.log('Database connected (SQL.js)'))
  .catch((err) => console.error('Database connection error:', err));

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

export { dataSource };
