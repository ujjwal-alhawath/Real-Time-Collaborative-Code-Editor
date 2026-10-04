import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';

const app = express();

// ── Security Middleware ───────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(mongoSanitize());

// ── Rate Limiting ─────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body Parsing ──────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request Logging ───────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ── API Routes ────────────────────────────────
app.use('/api/v1', routes);

// ── Swagger Docs ──────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CodeSync API Docs',
}));

// ── 404 Handler ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ── Global Error Handler ──────────────────────
app.use(errorHandler);

export default app;
