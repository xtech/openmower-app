import {ReactElement} from 'react';

export interface NavigationItem {
  label: string;
  icon: ReactElement;
  path: string;
  isGlobal: boolean;
}

export interface Mower {
  id: string;
  name: string;
  status: 'active' | 'docked' | 'error' | 'unknown';
  battery: number;
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

// Mock data - in real app this would come from API
export const mockMowers: Mower[] = [
  {id: '1', name: 'LawnBot Alpha', status: 'active', battery: 85},
  {id: '2', name: 'LawnBot Beta', status: 'docked', battery: 100},
];
