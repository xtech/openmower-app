'use client';

import {
  BatteryChargingFull as ChargingIcon,
  BatteryFull as FullIcon,
  BatteryAlert as EmptyIcon,
  WarningAmber as CritIcon,
  Tune as CustomIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Slider,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type {Theme} from '@mui/material/styles';
import {useState} from 'react';

interface BatteryGaugeProps {
  percentage: number; // 0..1
  volts: number;
  charging: boolean;
  pending: boolean;
  onFull: () => void;
  onEmpty: () => void;
  onSetVolts: (volts: number) => void;
}

// 7-cell pack: empty ≈ 22.4 V, full ≈ 29.26 V. Criticals sit just outside that.
const CRIT_LOW_VOLTS = 21.0;
const CRIT_HIGH_VOLTS = 30.0;
const MIN_VOLTS = 18;
const MAX_VOLTS = 32;

function levelColor(pct: number, theme: Theme): string {
  if (pct <= 0.15) return theme.palette.error.main;
  if (pct <= 0.35) return theme.palette.warning.main;
  return theme.palette.success.main;
}

export default function BatteryGauge({
  percentage,
  volts,
  charging,
  pending,
  onFull,
  onEmpty,
  onSetVolts,
}: BatteryGaugeProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, percentage));
  const color = charging ? theme.palette.info.main : levelColor(pct, theme);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [voltInput, setVoltInput] = useState(volts.toFixed(2));

  const openDialog = () => {
    setVoltInput(volts.toFixed(2));
    setDialogOpen(true);
  };

  const parsed = parseFloat(voltInput);
  const valid = Number.isFinite(parsed);

  const submit = () => {
    if (!valid) return;
    const clamped = Math.min(MAX_VOLTS, Math.max(MIN_VOLTS, parsed));
    onSetVolts(clamped);
    setDialogOpen(false);
  };

  // Battery body geometry (viewBox units).
  const bodyX = 4;
  const bodyY = 10;
  const bodyW = 150;
  const bodyH = 70;
  const pad = 6;
  const fillMax = bodyW - pad * 2;
  const fillW = fillMax * pct;

  return (
    <Box>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
        <Typography variant="subtitle1" fontWeight={700}>
          Battery
        </Typography>
        {charging && (
          <Chip size="small" color="info" icon={<ChargingIcon />} label="Charging" sx={{fontWeight: 600}} />
        )}
      </Box>

      <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
        <Box sx={{flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5}}>
          <Tooltip title="Set exact voltage">
            <Box
              role="button"
              onClick={openDialog}
              sx={{
                position: 'relative',
                width: 130,
                maxWidth: '100%',
                cursor: 'pointer',
                borderRadius: 1,
                transition: 'transform 0.15s ease',
                '&:hover': {transform: 'scale(1.03)'},
              }}
            >
            <Box component="svg" viewBox="0 0 174 90" sx={{width: '100%', height: 'auto', display: 'block'}}>
              {/* Battery shell */}
              <rect
                x={bodyX}
                y={bodyY}
                width={bodyW}
                height={bodyH}
                rx={10}
                fill="none"
                stroke={theme.palette.divider}
                strokeWidth={3}
              />
              {/* Positive terminal */}
              <rect
                x={bodyX + bodyW + 2}
                y={bodyY + bodyH / 2 - 12}
                width={10}
                height={24}
                rx={3}
                fill={theme.palette.divider}
              />
              {/* Fill */}
              <rect
                x={bodyX + pad}
                y={bodyY + pad}
                width={Math.max(fillW, fillW > 0 ? 4 : 0)}
                height={bodyH - pad * 2}
                rx={5}
                fill={color}
                style={{transition: 'width 0.5s ease, fill 0.3s ease'}}
              />
            </Box>
            {charging && (
              <ChargingIcon
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 36,
                  color: theme.palette.common.white,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                  pointerEvents: 'none',
                }}
              />
            )}
            </Box>
          </Tooltip>
          <Box
            onClick={openDialog}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              color: 'text.secondary',
              '&:hover': {color: 'text.primary'},
            }}
          >
            <CustomIcon sx={{fontSize: 14}} />
            <Typography variant="caption">Tap to set voltage</Typography>
          </Box>
        </Box>

        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 70}}>
          <Typography variant="h3" fontWeight={800} sx={{color, lineHeight: 1}}>
            {Math.round(pct * 100)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, fontFamily: 'monospace'}}>
            {volts.toFixed(2)} V
          </Typography>
        </Box>

        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 120}}>
          <Button size="small" variant="outlined" color="error" startIcon={<CritIcon />} disabled={pending} onClick={() => onSetVolts(CRIT_LOW_VOLTS)}>
            Crit low
          </Button>
          <Button size="small" variant="outlined" color="warning" startIcon={<EmptyIcon />} disabled={pending} onClick={onEmpty}>
            Empty
          </Button>
          <Button size="small" variant="outlined" color="success" startIcon={<FullIcon />} disabled={pending} onClick={onFull}>
            Full
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<CritIcon />} disabled={pending} onClick={() => onSetVolts(CRIT_HIGH_VOLTS)}>
            Crit high
          </Button>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set battery voltage</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Pack voltage"
            value={voltInput}
            onChange={(e) => setVoltInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            error={voltInput !== '' && !valid}
            slotProps={{
              input: {endAdornment: <InputAdornment position="end">V</InputAdornment>},
              htmlInput: {inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*'},
            }}
            sx={{mt: 1}}
          />
          <Box sx={{px: 1, mt: 2}}>
            <Slider
              value={valid ? Math.min(MAX_VOLTS, Math.max(MIN_VOLTS, parsed)) : MIN_VOLTS}
              min={MIN_VOLTS}
              max={MAX_VOLTS}
              step={0.1}
              valueLabelDisplay="auto"
              marks={[
                {value: MIN_VOLTS, label: `${MIN_VOLTS}`},
                {value: MAX_VOLTS, label: `${MAX_VOLTS}`},
              ]}
              onChange={(_, v) => setVoltInput((v as number).toFixed(1))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={submit} variant="contained" disabled={!valid || pending}>
            Set
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
