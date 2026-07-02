'use client';

import VirtualJoystick from '@/components/map/teleop/VirtualJoystick';
import {Gamepad as TwistIcon, Stop as ReleaseIcon} from '@mui/icons-material';
import {Box, Button, Chip, CircularProgress, Typography, useTheme} from '@mui/material';
import {useCallback, useEffect, useRef, useState} from 'react';

interface TwistCardProps {
  active: boolean;
  linear: number;
  angular: number;
  pending: boolean;
  onApply: (linear: number, angular: number) => void;
  onRelease: () => void;
}

const LINEAR_MAX = 1.0; // m/s at full stick
const ANGULAR_MAX = 2.0; // rad/s at full stick
// VirtualJoystick scales its angular axis (vz) by this internally, so undo it to
// normalize vz back to [-1, 1] before applying our own max.
const JOYSTICK_ANGULAR_FACTOR = 1.6;
const SEND_INTERVAL_MS = 100; // throttle RPCs while the stick is held

export default function TwistCard({active, linear, angular, pending, onApply, onRelease}: TwistCardProps) {
  const theme = useTheme();
  const [display, setDisplay] = useState({lin: linear, ang: angular});

  const latest = useRef({lin: 0, ang: 0});
  const lastSent = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTrailing = () => {
    if (trailing.current !== null) {
      clearTimeout(trailing.current);
      trailing.current = null;
    }
  };

  const flush = useCallback(() => {
    lastSent.current = performance.now();
    onApply(latest.current.lin, latest.current.ang);
  }, [onApply]);

  // Rate-limit sends: fire immediately if enough time passed, otherwise schedule a
  // single trailing send so the sim always ends up with the final stick value.
  const schedule = useCallback(() => {
    const dt = performance.now() - lastSent.current;
    if (dt >= SEND_INTERVAL_MS) {
      clearTrailing();
      flush();
    } else if (trailing.current === null) {
      trailing.current = setTimeout(() => {
        trailing.current = null;
        flush();
      }, SEND_INTERVAL_MS - dt);
    }
  }, [flush]);

  const handleVelocity = useCallback(
    (vx: number, vz: number) => {
      const next = {lin: vx * LINEAR_MAX, ang: (vz / JOYSTICK_ANGULAR_FACTOR) * ANGULAR_MAX};
      latest.current = next;
      setDisplay(next);
      schedule();
    },
    [schedule],
  );

  // Reflect override values coming back from the sim while active and the stick is idle.
  useEffect(() => {
    if (active && latest.current.lin === 0 && latest.current.ang === 0) {
      setDisplay({lin: linear, ang: angular});
    }
  }, [active, linear, angular]);

  useEffect(() => () => clearTrailing(), []);

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
            Movement override
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drive the robot directly with the joystick, ignoring the mower logic
          </Typography>
        </Box>
        {active && <Chip label="Override active" size="small" color="info" variant="outlined" />}
        {pending && <CircularProgress size={18} />}
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
              Linear
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{fontFamily: 'monospace'}}>
              {display.lin.toFixed(2)} <Typography component="span" variant="caption" color="text.secondary">m/s</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Angular
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{fontFamily: 'monospace'}}>
              {display.ang.toFixed(2)} <Typography component="span" variant="caption" color="text.secondary">rad/s</Typography>
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="inherit"
            disabled={pending || !active}
            startIcon={<ReleaseIcon />}
            onClick={() => {
              latest.current = {lin: 0, ang: 0};
              setDisplay({lin: 0, ang: 0});
              clearTrailing();
              onRelease();
            }}
          >
            Release
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
