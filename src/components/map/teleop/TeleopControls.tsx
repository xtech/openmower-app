'use client';

import { useTeleop } from '@/hooks/useTeleop';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import SpeedLever from './SpeedLever';
import VirtualJoystick from './VirtualJoystick';

interface TeleopControlsProps {
  simulatorMode?: boolean;
}

const MIN_SPEED = 0.3;
const MAX_SPEED = 1.0;
const SPEED_MULTIPLIERS = [MIN_SPEED, (MIN_SPEED + MAX_SPEED) / 2, MAX_SPEED];

export default function TeleopControls({ simulatorMode = false }: TeleopControlsProps) {
  const { setVelocity } = useTeleop();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [speedState, setSpeedState] = useState(1);
  const rawVelocity = useRef({ vx: 0, vz: 0 });

  const handleVelocityChange = useCallback(
    (vx: number, vz: number) => {
      rawVelocity.current = { vx, vz };
      const mult = SPEED_MULTIPLIERS[speedState];
      setVelocity(vx * mult, vz * mult);
    },
    [setVelocity, speedState],
  );

  // When speed state changes, re-emit the last known velocity immediately
  useEffect(() => {
    const { vx, vz } = rawVelocity.current;
    if (vx !== 0 || vz !== 0) {
      const mult = SPEED_MULTIPLIERS[speedState];
      setVelocity(vx * mult, vz * mult);
    }
  }, [speedState, setVelocity]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: isMobile ? 16 : 24,
        left: isMobile ? '50%' : 24,
        transform: isMobile ? 'translateX(-50%)' : 'none',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <SpeedLever value={speedState} onChange={setSpeedState} simulatorMode={simulatorMode} />
      <VirtualJoystick onVelocityChange={handleVelocityChange} simulatorMode={simulatorMode} />
    </Box>
  );
}
