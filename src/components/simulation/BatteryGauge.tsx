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
import {useSelectedMower} from '@/stores/mowersStore';

const VOLTAGE_MARGIN = 2;

interface BatteryGaugeProps {
  voltage: number;
  charging: boolean;
  pending: boolean;
  onSetVoltage: (voltage: number) => void;
}

function levelColor(pct: number, theme: Theme): string {
  if (pct <= 0.15) return theme.palette.error.main;
  if (pct <= 0.35) return theme.palette.warning.main;
  return theme.palette.success.main;
}

export default function BatteryGauge({
  voltage,
  charging,
  pending,
  onSetVoltage,
}: BatteryGaugeProps) {
  const params = useSelectedMower((m) => m?.params ?? {});
  const percentage = useSelectedMower((m) => (m?.state.battery_percentage ?? 0) / 100);
  const fullVoltage = params['/ll/services/power/battery_full_voltage'];
  const emptyVoltage = params['/ll/services/power/battery_empty_voltage'];
  const critLowVoltage = params['/ll/services/power/battery_critical_voltage'];
  const critHighVoltage = params['/ll/services/power/battery_critical_high_voltage'];
  const minVoltage = critLowVoltage !== undefined ? critLowVoltage - VOLTAGE_MARGIN : undefined;
  const maxVoltage = critHighVoltage !== undefined ? critHighVoltage + VOLTAGE_MARGIN : undefined;
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, percentage));
  const color = charging ? theme.palette.info.main : levelColor(pct, theme);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [voltageInput, setVoltageInput] = useState(voltage.toFixed(2));

  const openDialog = () => {
    setVoltageInput(voltage.toFixed(2));
    setDialogOpen(true);
  };

  const parsed = parseFloat(voltageInput);
  const valid = Number.isFinite(parsed);

  const submit = () => {
    if (!valid || minVoltage === undefined || maxVoltage === undefined) return;
    const clamped = Math.min(maxVoltage, Math.max(minVoltage, parsed));
    onSetVoltage(clamped);
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
            {voltage.toFixed(2)} V
          </Typography>
        </Box>

        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 120}}>
          {critLowVoltage !== undefined && (
            <Button size="small" variant="outlined" color="error" startIcon={<CritIcon />} disabled={pending} onClick={() => onSetVoltage(critLowVoltage)}>
              Crit low
            </Button>
          )}
          {emptyVoltage !== undefined && (
            <Button size="small" variant="outlined" color="warning" startIcon={<EmptyIcon />} disabled={pending} onClick={() => onSetVoltage(emptyVoltage)}>
              Empty
            </Button>
          )}
          {fullVoltage !== undefined && (
            <Button size="small" variant="outlined" color="success" startIcon={<FullIcon />} disabled={pending} onClick={() => onSetVoltage(fullVoltage)}>
              Full
            </Button>
          )}
          {critHighVoltage !== undefined && (
            <Button size="small" variant="outlined" color="error" startIcon={<CritIcon />} disabled={pending} onClick={() => onSetVoltage(critHighVoltage)}>
              Crit high
            </Button>
          )}
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set battery voltage</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Pack voltage"
            value={voltageInput}
            onChange={(e) => setVoltageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            error={voltageInput !== '' && !valid}
            slotProps={{
              input: {endAdornment: <InputAdornment position="end">V</InputAdornment>},
              htmlInput: {inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*'},
            }}
            sx={{mt: 1}}
          />
          {minVoltage !== undefined && maxVoltage !== undefined && (
            <Box sx={{px: 1, mt: 2}}>
              <Slider
                value={valid ? Math.min(maxVoltage, Math.max(minVoltage, parsed)) : minVoltage}
                min={minVoltage}
                max={maxVoltage}
                step={0.1}
                valueLabelDisplay="auto"
                marks={[
                  {value: minVoltage, label: minVoltage.toFixed(0)},
                  {value: maxVoltage, label: maxVoltage.toFixed(0)},
                ]}
                onChange={(_, v) => setVoltageInput((v as number).toFixed(1))}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={submit} variant="contained" disabled={!valid || pending || minVoltage === undefined || maxVoltage === undefined}>
            Set
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
