'use server';

import {AppConfig} from '@/components/types';
import {promises as fs} from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

function loadConfigFromEnv(): AppConfig | null {
  const name = process.env.MOWER_NAME;
  const mqtt_ws_url = process.env.MOWER_MQTT_WS_URL;
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
  const envConfig = loadConfigFromEnv();
  if (envConfig) return envConfig;

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading configuration:', error);
    throw new Error('Failed to read configuration');
  }
}
