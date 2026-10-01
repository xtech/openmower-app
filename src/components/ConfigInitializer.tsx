'use client';

import { AppConfig } from '@/components/types';
import { useConfigStore } from '@/stores/configStore';
import { useMowersStore } from '@/stores/mowersStore';

interface ConfigInitializerProps {
  config: AppConfig;
}

export function ConfigInitializer({ config }: ConfigInitializerProps) {
  const setConfig = useConfigStore((s) => s.setConfig);
  setConfig(config);
  useMowersStore.getState().loadMowers();
  return null;
}
