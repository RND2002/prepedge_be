import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { connectToDatabase } from './lib/mongodb';
import { rateLimiter } from './lib/rateLimiter';
import newsletterRouter from './newsletter/newsletter.route';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }));

// Trust proxy for rate limiter to get actual IP if behind reverse proxy
app.set('trust proxy', 1);

// Routes
app.use('/api/newsletter', rateLimiter, newsletterRouter);

// Initialize and start server
const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  console.log('--- STARTUP DIAGNOSTICS ---');
  console.log(`PORT Variable: ${process.env.PORT ? 'Set (' + process.env.PORT + ')' : 'MISSING'}`);
  console.log(`MONGODB_URI Variable: ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
  console.log('---------------------------');
  
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
