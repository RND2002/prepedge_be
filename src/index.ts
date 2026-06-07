import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from './lib/mongodb';
import { rateLimiter } from './lib/rateLimiter';
import newsletterRouter from './newsletter/newsletter.route';
import authRouter from './auth/auth.route';
import userRouter from './users/user.route';
import onboardingRouter from './onboarding/onboarding.route';
import dashboardRouter from './dashboard/dashboard.route';
import interviewRouter from './interview/interview.route';
import adminRouter from './admin/admin.route';
import { seedDefaultAdmin } from './admin/admin.service';
import { startStaleSessionCronJob } from './jobs/expireStaleSessions';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: [process.env.FRONTEND_URL as string, 'https://release-prepedge.netlify.app', 'http://localhost:3000'] }));

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Trust proxy for rate limiter to get actual IP if behind reverse proxy
app.set('trust proxy', 1);

// Routes
app.use('/api/newsletter', rateLimiter, newsletterRouter);
app.use('/api/auth', rateLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/admin', adminRouter);

// Initialize and start server
const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  console.log('--- STARTUP DIAGNOSTICS ---');
  console.log(`PORT Variable: ${process.env.PORT ? 'Set (' + process.env.PORT + ')' : 'MISSING'}`);
  console.log(`MONGODB_URI Variable: ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
  console.log('---------------------------');

  await connectToDatabase().then(async () => {
    await seedDefaultAdmin();
  })
    .catch((error) => {
      console.error('Initial database connection failed:', error);
    });

  startStaleSessionCronJob();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
