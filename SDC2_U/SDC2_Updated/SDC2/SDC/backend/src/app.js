import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { AppError } from './utils/index.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import plannerRoutes from './routes/planner.js';
import authorityRoutes from './routes/authority.js';
import metaRoutes from './routes/meta.js';
import uploadRoutes from './routes/uploads.js';
import incidentRoutes from './routes/incidents.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: config.corsOrigins.length ? config.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/citizen/complaints', complaintRoutes);
  app.use('/api/planner', plannerRoutes);
  app.use('/api/authority', authorityRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api', metaRoutes);
  app.use('/uploads', uploadRoutes);

  // Serve the built frontend in production mode if present.
  const dist = config.frontendDist;
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api|uploads).*/, (req, res) => {
      const target = path.join(dist, 'index.html');
      if (fs.existsSync(target)) res.sendFile(target);
      else res.status(404).json({ error: 'Frontend build missing. Run `npm run build` in /frontend.' });
    });
  }

  // 404 for unknown API routes
  app.use('/api', (req, res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`)));

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500 && config.env !== 'test') {
      // eslint-disable-next-line no-console
      console.error('[server] error', err);
    } else if (status >= 500 && config.env === 'test') {
      // eslint-disable-next-line no-console
      console.error('[server-test] error', (err && err.stack) ? err.stack : err);
    }
    res.status(status).json({
      // Provider and timeout failures are operational errors with actionable
      // messages (for example a rate limit or unavailable model). Keep truly
      // unexpected 500s generic, but let the planner see why a 502/503/504
      // prevented the analysis from running.
      error: status >= 502 && status <= 504 ? err.message : status >= 500 ? 'An internal error occurred.' : err.message,
      detail: status >= 500 ? undefined : err.details,
    });
  });

  return app;
}
