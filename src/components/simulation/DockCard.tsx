'use client';

import {EvStation as DockIcon} from '@mui/icons-material';
import {Box, Button, Chip, CircularProgress, Typography, useTheme} from '@mui/material';

interface DockCardProps {
  charging: boolean;
  pending: boolean;
  onMoveToDock: () => void;
}

export default function DockCard({charging, pending, onMoveToDock}: DockCardProps) {
  const theme = useTheme();
  const color = charging ? theme.palette.success.main : theme.palette.info.main;

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
          <DockIcon />
        </Box>
        <Box sx={{flex: 1}}>
          <Typography variant="subtitle1" fontWeight={700}>
            Dock
          </Typography>
        </Box>
        {charging && <Chip label="Charging" size="small" color="success" variant="outlined" />}
        {pending && <CircularProgress size={18} />}
      </Box>

      <Button
        fullWidth
        variant="contained"
        color="primary"
        disabled={pending}
        startIcon={pending ? <CircularProgress size={18} color="inherit" /> : <DockIcon />}
        onClick={onMoveToDock}
        sx={{fontWeight: 700}}
      >
        Move to dock
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
        Teleports the robot onto the docking pose and starts charging.
      </Typography>
    </Box>
  );
}
