import { ShardingManager } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../shared/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  if (!config.discordToken) {
    console.error('[ShardManager] Fatal: DISCORD_TOKEN is not set.');
    process.exit(1);
  }

  // Determine worker file path (TS in dev / tsx, JS/CJS in prod)
  const isProd = config.isProduction;
  let botScript = path.join(__dirname, 'index.ts');
  if (isProd) {
    const distScript = path.join(process.cwd(), 'dist', 'services', 'discord-bot', 'index.js');
    if (fs.existsSync(distScript)) {
      botScript = distScript;
    }
  }

  const totalShards = config.shardCount || 'auto';
  console.log(`[ShardManager] Spawning Discord shards (Total Shards: ${totalShards}, Worker: ${botScript})...`);

  const manager = new ShardingManager(botScript, {
    token: config.discordToken,
    totalShards,
    mode: 'process',
    respawn: true,
    execArgv: process.execArgv,
  });

  manager.on('shardCreate', (shard) => {
    console.log(`[ShardManager] Launched shard ${shard.id}/${manager.totalShards}`);

    shard.on('ready', () => {
      console.log(`[ShardManager] Shard ${shard.id} reported READY!`);
    });

    shard.on('disconnect', () => {
      console.warn(`[ShardManager] Shard ${shard.id} disconnected.`);
    });

    shard.on('reconnecting', () => {
      console.log(`[ShardManager] Shard ${shard.id} reconnecting...`);
    });

    shard.on('death', (proc) => {
      console.error(`[ShardManager] Shard ${shard.id} died with exit code ${(proc as any)?.exitCode}. Respawning...`);
    });
  });

  await manager.spawn();
  console.log(`[ShardManager] All ${manager.totalShards} shards successfully spawned!`);
}

main().catch((err) => {
  console.error('[ShardManager] Fatal error launching shards:', err);
  process.exit(1);
});
