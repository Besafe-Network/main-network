import express from 'express';
import mongoose from 'mongoose';
import { workerSocketHub } from '../shared/worker-transport';

export function registerSystemRoutes(app: express.Express, serviceName: string, port: number) {
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: serviceName, uptime: process.uptime() });
  });

  app.get('/readyz', (_req, res) => {
    const isDbReady = mongoose.connection.readyState === 1;
    res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? 'ready' : 'not-ready',
      service: serviceName,
      dbReady: isDbReady,
    });
  });

  app.get('/api/services/status', async (_req, res) => {
    const [vrchatStatus, discordStatus] = await Promise.all([
      workerSocketHub.request('vrchat-bot', 'status').catch((error: Error) => ({
        status: serviceName === 'all' ? 'in-process' : 'offline',
        error: error.message,
      })),
      workerSocketHub.request('discord-bot', 'status').catch((error: Error) => ({
        status: serviceName === 'all' ? 'in-process' : 'offline',
        error: error.message,
      })),
    ]);

    res.json({
      dashboard: { status: 'online', serviceName, port },
      vrchatBot: vrchatStatus,
      discordBot: discordStatus,
    });
  });
}
