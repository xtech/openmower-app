'use client';

import {AppConfig} from '@/components/types';
import {createContext, useContext, type PropsWithChildren} from 'react';

const ConfigContext = createContext<AppConfig | undefined>(undefined);

export function ConfigProvider({config, children}: PropsWithChildren<{config: AppConfig}>) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext)!;
}
