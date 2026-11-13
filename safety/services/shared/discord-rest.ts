import { config } from './config';

export interface DiscordUserREST {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
}

export async function fetchDiscordUserViaREST(userId: string): Promise<DiscordUserREST | null> {
  if (!config.discordToken || !userId) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${config.discordToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as DiscordUserREST;
    return data;
  } catch (err: any) {
    return null;
  }
}

export async function fetchDiscordGuildViaREST(guildId: string): Promise<any | null> {
  if (!config.discordToken || !guildId) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
      headers: {
        Authorization: `Bot ${config.discordToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    return null;
  }
}
