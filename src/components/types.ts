import {ReactElement} from 'react';

export interface NavigationItem {
  label: string;
  icon: ReactElement;
  path: string;
  isGlobal: boolean;
}

export interface MowerConfig {
  id: string;
  name: string;
  mqtt_ws_url: string;
  mqtt_prefix: string;
  description: string;
}

export interface AppConfig {
  mowers: MowerConfig[];
}

export interface Mower extends MowerConfig {
  status: 'active' | 'docked' | 'error' | 'unknown';
  battery: number;
  operation?: string;
  estimatedTime?: string;
  location?: string;
  lastSeen?: string;
  efficiency?: number;
  speed?: string;
}

// Utility functions for mower status
export const getMowerStatusColor = (status: Mower['status']) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'docked':
      return 'info';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

export const getMowerStatusLabel = (status: Mower['status']) => {
  switch (status) {
    case 'active':
      return 'Mowing';
    case 'docked':
      return 'Docked';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};
