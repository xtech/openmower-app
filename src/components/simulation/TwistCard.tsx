'use client';

import {useTeleop} from '@/hooks/useTeleop';
import VirtualJoystick from '@/components/map/teleop/VirtualJoystick';
import {Gamepad as TwistIcon, Stop as ReleaseIcon} from '@mui/icons-material';
import {Box, Button, Chip, Typography, useTheme} from '@mui/material';
import {useCallback, useState} from 'react';

export default function TwistCard() {
  const theme = useTheme();
  const {setVelocity, release, active} = useTeleop({holdUntilRelease: true});
  const [display, setDisplay] = useState({vx: 0, vz: 0});

  const handleVelocity = useCallback(
    (vx: number, vz: number) => {
      setDisplay({vx, vz});
      setVelocity(vx, vz);
    },
    [setVelocity],
  );

  const handleRelease = useCallback(() => {
    setDisplay({vx: 0, vz: 0});
    release();
  }, [release]);

  const color = active ? theme.palette.info.main : theme.palette.text.secondary;

  return (
    <Box>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: `${color}22`,
            color,
          }}
        >
          <TwistIcon />
        </Box>
        <Box sx={{flex: 1}}>
          <Typography variant="subtitle1" fontWeight={700}>
            Manual drive
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Joystick keeps publishing until Release is pressed
          </Typography>
        </Box>
        {active && <Chip label="Active" size="small" color="info" variant="outlined" />}
      </Box>

      <Box sx={{display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap'}}>
        <Box sx={{display: 'flex', justifyContent: 'center', flexShrink: 0}}>
          <VirtualJoystick onVelocityChange={handleVelocity} />
        </Box>

        <Box sx={{flex: 1, minWidth: 180}}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              columnGap: 2,
              rowGap: 1,
              alignItems: 'baseline',
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Speed
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{fontFamily: 'monospace'}}>
              {display.vx.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Turn
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{fontFamily: 'monospace'}}>
              {display.vz.toFixed(2)}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="inherit"
            disabled={!active}
            startIcon={<ReleaseIcon />}
            onClick={handleRelease}
          >
            Release
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
