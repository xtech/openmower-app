'use client';

import {useTeleop} from '@/hooks/useTeleop';
import {Box, useMediaQuery, useTheme} from '@mui/material';
import VirtualJoystick from './VirtualJoystick';

export default function TeleopControls() {
  const {setVelocity} = useTeleop();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: isMobile ? 16 : 24,
        left: isMobile ? '50%' : 24,
        transform: isMobile ? 'translateX(-50%)' : 'none',
        zIndex: 10,
      }}
    >
      <VirtualJoystick onVelocityChange={setVelocity} />
    </Box>
  );
}
