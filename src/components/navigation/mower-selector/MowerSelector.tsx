'use client';

import type {MowerConfig} from '@/components/types';
import {useConfig} from '@/contexts/ConfigContext';
import {Menu} from '@mui/material';
import MowerSelectorHeader from './MowerSelectorHeader';
import MowerSelectorItem from './MowerSelectorItem';

interface MowerSelectorProps {
  onMowerSelect: (mower: MowerConfig) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export default function MowerSelector({onMowerSelect, anchorEl, onClose}: MowerSelectorProps) {
  const {mowers} = useConfig();
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 280,
            mt: 1,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
          },
        },
      }}
    >
      <MowerSelectorHeader />
      {mowers.map((mower) => (
        <MowerSelectorItem key={mower.id} mower={mower} onClick={onMowerSelect} />
      ))}
    </Menu>
  );
}
