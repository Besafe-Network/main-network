import express from 'express';
import { connectDB, disconnectDB } from '../shared/db';
import { config } from '../shared/config';
import { getShardConfiguration } from './k8s-sharding';
import { createDashboardDiscordRuntime } from './dashboard-runtime';
import { createDiscordRuntimeContext } from './runtime-context';
import { createDiscordProbeRouter, createDiscordWorkerCommands } from './api';
import { connectWorkerToDashboard, requestDashboardCommand } from '../shared/worker-client';

async function main() {
  const shardConfig = getShardConfiguration();
  console.log(`[Discord Bot Service] Starting...`);
  console.log(`[Discord Bot Service] Shard Configuration: Shard ${shardConfig.shardId} of ${shardConfig.shardCount} (Mode: ${shardConfig.source})`);

  if (!config.discordToken) {
    console.warn('[Discord Bot Service] Warning: DISCORD_TOKEN is not configured.');
  }

  // Connect to DB
  await connectDB();

  let workerSocket: ReturnType<typeof connectWorkerToDashboard> | undefined;
  const runtimeContext = createDiscordRuntimeContext(async (vrchatUserId) => {
    if (!workerSocket) throw new Error('Dashboard command socket is not connected');
    return requestDashboardCommand(workerSocket, 'vrchat-display-name', { vrchatUserId });
  });
  const discordRuntime = createDashboardDiscordRuntime(runtimeContext.context, shardConfig);
  const client = discordRuntime.client;
  runtimeContext.setClient(client);
  runtimeContext.setGuildClientResolver?.(discordRuntime.getGuildDiscordClient);
  workerSocket = connectWorkerToDashboard(
    'discord-bot',
    createDiscordWorkerCommands(
      client,
      shardConfig,
      () => discordRuntime.syncGlobalDiscordCommands(),
      {
        'sync-custom-bot': ({ guildData }: { guildData?: any }) => discordRuntime.syncCustomBotForGuild(guildData),
      },
      discordRuntime.getGuildDiscordClient
    ),
    { shardId: shardConfig.shardId }
  );

  // Keep only the health endpoints on HTTP; worker commands use the authenticated socket.
  const app = express();
  app.use(createDiscordProbeRouter(client, shardConfig));

  const server = app.listen(config.discordBotPort, '0.0.0.0', () => {
    console.log(`[Discord Bot Service] Probe server listening on http://0.0.0.0:${config.discordBotPort}`);
  });

  // Login to Discord Gateway
  if (config.discordToken) {
    client.login(config.discordToken).catch((err) => {
      console.error('[Discord Bot Service] Failed to login to Discord Gateway:', err?.message || err);
    });
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Discord Bot Service] Received ${signal}. Shutting down gracefully...`);
    client.destroy();
    workerSocket?.disconnect();
    server.close(async () => {
      await disconnectDB();
      console.log('[Discord Bot Service] Clean shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Discord Bot Service] Fatal error:', err);
  process.exit(1);
});
