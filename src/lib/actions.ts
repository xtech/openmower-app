'use server';

import { AppConfig } from '@/components/types';
import { promises as fs } from 'fs';
import { headers } from 'next/headers';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

async function loadConfigFromEnv(): Promise<AppConfig | null> {
  const name = process.env.MOWER_NAME ?? 'OpenMower';
  const host = (await headers()).get('host') ?? 'localhost';
  const hostname = host.split(':')[0];
  const mqtt_ws_url = process.env.MOWER_MQTT_WS_URL ?? `ws://${hostname}:9001`;
  const mqtt_prefix = process.env.MOWER_MQTT_PREFIX ?? '';

  if (!name || !mqtt_ws_url) return null;

  return {
    mowers: [
      {
        id: '1',
        name,
        mqtt_ws_url,
        mqtt_prefix,
        description: '',
      },
    ],
  };
}

export async function loadAppConfig(): Promise<AppConfig> {
  const envConfig = await loadConfigFromEnv();
  if (envConfig) return envConfig;

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading configuration:', error);
    throw new Error('Failed to read configuration');
  }
}
