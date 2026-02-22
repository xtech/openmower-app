'use client';

import type {FormErrors} from '@remoteoss/json-schema-form';
import {createContext, useContext} from 'react';

interface SettingsContextValue {
  defaults: Record<string, unknown>;
  confirmedFields: Set<string>;
  /** Flat map of dot-separated field path → error message */
  flatFormErrors: Record<string, string> | null;
  onFieldChange: (path: string) => void;
  onFieldReset: (path: string) => void;
}

export function flattenFormErrors(errors: FormErrors, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[path] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          Object.assign(result, flattenFormErrors(item as FormErrors, `${path}.${i}`));
        }
      });
    } else if (value && typeof value === 'object') {
      Object.assign(result, flattenFormErrors(value as FormErrors, path));
    }
  }
  return result;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside SettingsForm');
  return ctx;
}
