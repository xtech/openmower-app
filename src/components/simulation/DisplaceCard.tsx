'use client';

import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowLeft as LeftIcon,
  KeyboardArrowRight as RightIcon,
  KeyboardArrowUp as UpIcon,
  MyLocation as JumpIcon,
} from '@mui/icons-material';
import {Box, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Typography, useTheme} from '@mui/material';
import {useState} from 'react';

interface DisplaceCardProps {
  pending: boolean;
  /** dx, dy in meters (map frame). */
  onDisplace: (dx: number, dy: number) => void;
}

const STEPS = [0.25, 0.5, 1, 2];

export default function DisplaceCard({pending, onDisplace}: DisplaceCardProps) {
  const theme = useTheme();
  const [step, setStep] = useState(0.5);

  const PadButton = ({dx, dy, children}: {dx: number; dy: number; children: React.ReactNode}) => (
    <IconButton
      disabled={pending}
      onClick={() => onDisplace(dx * step, dy * step)}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
      }}
    >
      {children}
    </IconButton>
  );

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
            bgcolor: `${theme.palette.warning.main}22`,
            color: theme.palette.warning.main,
          }}
        >
          <JumpIcon />
        </Box>
        <Box sx={{flex: 1}}>
          <Typography variant="subtitle1" fontWeight={700}>
            GPS jump
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Teleport the robot to simulate a GPS jump
          </Typography>
        </Box>
        {pending && <CircularProgress size={18} />}
      </Box>

      <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap'}}>
        {/* Directional pad: +Y = up (map north). */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 40px)',
            gridTemplateRows: 'repeat(3, 40px)',
            gap: 0.5,
            justifyItems: 'center',
            alignItems: 'center',
          }}
        >
          <Box sx={{gridColumn: 2, gridRow: 1}}>
            <PadButton dx={0} dy={1}>
              <UpIcon />
            </PadButton>
          </Box>
          <Box sx={{gridColumn: 1, gridRow: 2}}>
            <PadButton dx={-1} dy={0}>
              <LeftIcon />
            </PadButton>
          </Box>
          <Box sx={{gridColumn: 3, gridRow: 2}}>
            <PadButton dx={1} dy={0}>
              <RightIcon />
            </PadButton>
          </Box>
          <Box sx={{gridColumn: 2, gridRow: 3}}>
            <PadButton dx={0} dy={-1}>
              <DownIcon />
            </PadButton>
          </Box>
        </Box>

        <Box sx={{flex: 1, minWidth: 140}}>
          <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
            Step size
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={step}
            onChange={(_, v) => v != null && setStep(v)}
            disabled={pending}
          >
            {STEPS.map((s) => (
              <ToggleButton key={s} value={s} sx={{px: 1.5}}>
                {s} m
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Box>
  );
}
