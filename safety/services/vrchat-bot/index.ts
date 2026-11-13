import express from 'express';
import { connectDB, disconnectDB } from '../shared/db';
import { createVRChatProbeRouter, createVRChatWorkerCommands } from './api';
import { startVRChatWorkers, stopVRChatWorkers } from './worker';
import { setVRChatWorkerSocket } from './vrchat-client';
import { config } from '../shared/config';
import { connectWorkerToDashboard } from '../shared/worker-client';

async function main() {
  console.log(`[VRChat Bot Service] Initializing on port ${config.vrchatBotPort}...`);
  console.log(`[VRChat Bot Service] Sharding: Instance ${config.vrcInstanceId} of ${config.vrcTotalInstances}`);

  await connectDB();
  const workerSocket = connectWorkerToDashboard('vrchat-bot', createVRChatWorkerCommands());
  setVRChatWorkerSocket(workerSocket);

  const app = express();
  app.use(createVRChatProbeRouter());

  const server = app.listen(config.vrchatBotPort, '0.0.0.0', () => {
    console.log(`[VRChat Bot Service] Probe server listening on http://0.0.0.0:${config.vrchatBotPort}`);
  });

  // Start background worker tasks
  startVRChatWorkers(config.vrcInstanceId, config.vrcTotalInstances);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[VRChat Bot Service] Received ${signal}. Shutting down gracefully...`);
    stopVRChatWorkers();
    workerSocket.disconnect();
    server.close(async () => {
      await disconnectDB();
      console.log('[VRChat Bot Service] Clean shutdown completed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[VRChat Bot Service] Fatal startup error:', err);
  process.exit(1);
});
