import {AppConfig} from '@/components/types';
import {create} from 'zustand';

interface ConfigStore {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: {mowers: []},
  setConfig: (config) => set({config}),
}));

export const useMowerConfigs = () => useConfigStore((s) => s.config.mowers);
