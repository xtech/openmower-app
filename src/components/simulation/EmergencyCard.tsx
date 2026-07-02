'use client';

import {outerCardStyles} from '@/lib/cardStyles';
import {
  CheckCircle as OkIcon,
  ReportProblem as EmergencyIcon,
  RestartAlt as ClearIcon,
} from '@mui/icons-material';
import {Box, Button, Card, CardContent, Chip, CircularProgress, Typography, useTheme} from '@mui/material';
import {decodeEmergencyReasons} from './emergencyReason';

interface EmergencyCardProps {
  latched: boolean;
  reason: number;
  pending: boolean;
  onSet: (active: boolean) => void;
}

export default function EmergencyCard({latched, reason, pending, onSet}: EmergencyCardProps) {
  const theme = useTheme();
  const reasons = decodeEmergencyReasons(reason);

  return (
    <Card
      sx={{
        ...outerCardStyles(theme),
        position: 'relative',
        overflow: 'hidden',
        ...(latched && {
          border: `1px solid ${theme.palette.error.main}`,
          // Keep an opaque base so the card stays dark, then layer only the red tint on
          // top as a background image. Using the `background` shorthand here would wipe
          // the base color and let the page show through (card looked transparent).
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : 'rgba(255,255,255,0.95)',
          backgroundImage:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.error.dark}55 0%, transparent 70%)`
              : `linear-gradient(135deg, ${theme.palette.error.light}55 0%, transparent 70%)`,
        }),
      }}
    >
      <CardContent>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap'}}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: latched ? 'error.main' : 'success.main',
              color: 'common.white',
              flexShrink: 0,
            }}
          >
            {latched ? <EmergencyIcon /> : <OkIcon />}
          </Box>
          <Box sx={{flex: 1, minWidth: 160}}>
            <Typography variant="h6" fontWeight={700}>
              Emergency
            </Typography>
            <Typography variant="body2" color={latched ? 'error.main' : 'text.secondary'} fontWeight={latched ? 700 : 400}>
              {latched ? 'Latched — robot stopped' : 'Clear — normal operation'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color={latched ? 'error' : 'inherit'}
            size="large"
            disabled={pending}
            startIcon={
              pending ? <CircularProgress size={18} color="inherit" /> : latched ? <ClearIcon /> : <EmergencyIcon />
            }
            onClick={() => onSet(!latched)}
            sx={{fontWeight: 700, minWidth: 190}}
          >
            {latched ? 'Clear emergency' : 'Trigger emergency'}
          </Button>
        </Box>

        {latched && reasons.length > 0 && (
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2, pl: 8.5}}>
            {reasons.map((r) => (
              <Chip key={r} label={r} size="small" color="error" variant="outlined" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
