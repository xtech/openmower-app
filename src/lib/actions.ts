'use server';

import {AppConfig} from '@/components/types';
import {promises as fs} from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading configuration:', error);
    throw new Error('Failed to read configuration');
  }
}
