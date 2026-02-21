'use client';

import {createContext, useContext} from 'react';

interface SettingsContextValue {
  defaults: Record<string, unknown>;
  confirmedFields: Set<string>;
  onFieldChange: (path: string) => void;
  onFieldReset: (path: string) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside SettingsForm');
  return ctx;
}
