'use client';

import {useSimControl} from '@/hooks/useSimControl';
import {useSelectedMower} from '@/stores/mowersStore';
import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowLeft as LeftIcon,
  KeyboardArrowRight as RightIcon,
  ScienceOutlined as SimulatorIcon,
  KeyboardArrowUp as UpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  Popover,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import {useRControl} from 'maplibre-react-components';
import {useCallback, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

interface SimulatorButtonProps {
  manualDrive: boolean;
  onManualDriveChange: (enabled: boolean) => void;
}

const STEPS = [0.25, 0.5, 1, 2];

interface BatterySliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  emptyVoltage?: number;
  fullVoltage?: number;
  critLowVoltage: number;
  critHighVoltage: number;
}

const TRACK_H = 20;
const PAD_X = 0;
const SVG_H = TRACK_H;

function BatterySlider({
  value,
  onChange,
  min,
  max,
  emptyVoltage,
  fullVoltage,
  critLowVoltage,
  critHighVoltage,
}: BatterySliderProps) {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(300);
  const [dragging, setDragging] = useState(false);

  const measuredRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
  }, []);

  const trackW = Math.max(1, width - PAD_X * 2);
  const toX = useCallback((v: number) => PAD_X + ((v - min) / (max - min)) * trackW, [min, max, trackW]);
  const toV = useCallback(
    (x: number) => {
      const clamped = Math.max(0, Math.min(trackW, x - PAD_X));
      return Math.round((min + (clamped / trackW) * (max - min)) * 10) / 10;
    },
    [min, max, trackW],
  );

  const thumbX = Math.max(PAD_X, Math.min(PAD_X + trackW, toX(value)));
  const xCritLow = toX(critLowVoltage);
  const xEmpty = emptyVoltage !== undefined ? toX(emptyVoltage) : xCritLow;
  const xFull = fullVoltage !== undefined ? toX(fullVoltage) : toX(max);
  const xCritHigh = toX(critHighVoltage);

  const dark = theme.palette.mode === 'dark';
  const colRed = dark ? '#ef4444' : '#f87171';
  const colYellow = dark ? '#eab308' : '#facc15';
  const colGreen = dark ? '#22c55e' : '#4ade80';

  const handlePointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      // scale from CSS pixels to viewBox units
      const scale = width / rect.width;
      const x = (e.clientX - rect.left) * scale;
      onChange(toV(x));
    },
    [onChange, toV, width],
  );

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    setDragging(true);
    handlePointer(e);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) handlePointer(e);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragging(false);
    (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
  };

  const rx = 3;

  return (
    <Box ref={measuredRef} sx={{px: 1.5, pb: 1}}>
      <svg
        ref={svgRef}
        width="100%"
        height={SVG_H}
        viewBox={`0 0 ${width} ${SVG_H}`}
        style={{display: 'block', cursor: 'text', userSelect: 'none', overflow: 'visible'}}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <clipPath id="batt-clip">
            <rect x={PAD_X} y={0} width={trackW} height={TRACK_H} rx={rx} />
          </clipPath>
        </defs>

        {/* Zone 1: red   (min → critLow) */}
        <rect
          x={PAD_X}
          y={0}
          width={Math.max(0, xCritLow - PAD_X)}
          height={TRACK_H}
          fill={colRed}
          clipPath="url(#batt-clip)"
        />
        {/* Zone 2: yellow (critLow → empty) */}
        <rect
          x={xCritLow}
          y={0}
          width={Math.max(0, xEmpty - xCritLow)}
          height={TRACK_H}
          fill={colYellow}
          clipPath="url(#batt-clip)"
        />
        {/* Zone 3: green  (empty → full) */}
        <rect
          x={xEmpty}
          y={0}
          width={Math.max(0, xFull - xEmpty)}
          height={TRACK_H}
          fill={colGreen}
          clipPath="url(#batt-clip)"
        />
        {/* Zone 4: yellow (full → critHigh) */}
        <rect
          x={xFull}
          y={0}
          width={Math.max(0, xCritHigh - xFull)}
          height={TRACK_H}
          fill={colYellow}
          clipPath="url(#batt-clip)"
        />
        {/* Zone 5: red   (critHigh → max) */}
        <rect
          x={xCritHigh}
          y={0}
          width={Math.max(0, PAD_X + trackW - xCritHigh)}
          height={TRACK_H}
          fill={colRed}
          clipPath="url(#batt-clip)"
        />

        {/* Track border */}
        <rect
          x={PAD_X}
          y={0}
          width={trackW}
          height={TRACK_H}
          rx={rx}
          fill="none"
          stroke={theme.palette.divider}
          strokeWidth={1}
        />

        {/* Thumb: vertical line */}
        <line x1={thumbX} y1={0} x2={thumbX} y2={TRACK_H} stroke="black" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </Box>
  );
}

const rowSx = {mx: 0, px: 1, py: 0.25, width: '100%', justifyContent: 'space-between'} as const;

export default function SimulatorButton({manualDrive, onManualDriveChange}: SimulatorButtonProps) {
  const {container} = useRControl({position: 'bottom-right'});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [displaceStep, setDisplaceStep] = useState(0.5);

  const theme = useTheme();

  const {simState, available, setEmergency, setMovementAllowed, setBatteryVoltage, setGpsGood, moveToDock, displace} =
    useSimControl();

  const params = useSelectedMower((m) => m?.params ?? {});
  const fullVoltage = params['/ll/services/power/battery_full_voltage'];
  const emptyVoltage = params['/ll/services/power/battery_empty_voltage'];
  const critLowVoltage = params['/ll/services/power/battery_critical_voltage'];
  const critHighVoltage = params['/ll/services/power/battery_critical_high_voltage'];
  const batteryPct = useSelectedMower((m) => m?.state.battery_percentage ?? null);

  const hasActivity =
    manualDrive || simState?.emergency_latch || simState?.gps_good === false || simState?.movement_allowed === false;

  const content = (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Simulator"
        onClick={() => setOpen((o) => !o)}
        style={{padding: 0, position: 'relative'}}
      >
        <SimulatorIcon />
        {hasActivity && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: simState?.emergency_latch ? theme.palette.error.main : '#0ea5e9',
            }}
          />
        )}
      </button>

      <Popover
        open={open}
        anchorEl={buttonRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'bottom', horizontal: 'right'}}
        slotProps={{paper: {sx: {width: 460, py: 1}}}}
      >
        <Typography variant="overline" sx={{px: 1.5, display: 'block', lineHeight: 2.5}}>
          Simulator
        </Typography>

        {available && simState ? (
          <>
          <Box sx={{display: 'flex', gap: 0, alignItems: 'flex-start'}}>
            {/* Left column */}
            <Box sx={{flex: 1, minWidth: 0}}>
              {/* Boolean toggles via Switch */}
              <FormControlLabel
                sx={rowSx}
                labelPlacement="start"
                control={<Switch checked={manualDrive} onChange={(e) => onManualDriveChange(e.target.checked)} />}
                label="Manual drive"
              />

              <FormControlLabel
                sx={rowSx}
                labelPlacement="start"
                label="GPS fix"
                control={<Switch checked={simState.gps_good} onChange={(e) => setGpsGood(e.target.checked)} />}
              />
              <FormControlLabel
                sx={rowSx}
                labelPlacement="start"
                label="Traction"
                control={
                  <Switch checked={simState.movement_allowed} onChange={(e) => setMovementAllowed(e.target.checked)} />
                }
              />

              <Divider sx={{my: 1}} />

              {/* Battery slider */}
              <Typography variant="caption" color="text.secondary" sx={{px: 1.5, display: 'block', mb: 0.5}}>
                Battery{batteryPct !== null ? ` — ${batteryPct}%` : ''}{' '}
                <Typography component="span" variant="caption" color="text.disabled">
                  {simState.battery_voltage.toFixed(1)} V
                </Typography>
              </Typography>
              {critLowVoltage !== undefined && critHighVoltage !== undefined ? (
                <BatterySlider
                  value={simState.battery_voltage}
                  onChange={setBatteryVoltage}
                  min={Math.min(critLowVoltage, critHighVoltage) - 0.5}
                  max={Math.max(critLowVoltage, critHighVoltage) + 0.5}
                  emptyVoltage={emptyVoltage}
                  fullVoltage={fullVoltage}
                  critLowVoltage={critLowVoltage}
                  critHighVoltage={critHighVoltage}
                />
              ) : (
                <Typography variant="caption" color="text.disabled" sx={{px: 1.5, display: 'block', pb: 0.5}}>
                  Voltage params not available
                </Typography>
              )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{mx: 0.5}} />

            {/* Right column — GPS jump */}
            <Box sx={{px: 1, pt: 0.5, pb: 1}}>
              <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.75}}>
                GPS jump
              </Typography>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 32px)',
                    gridTemplateRows: 'repeat(3, 32px)',
                    gap: 0.25,
                    justifyItems: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{gridColumn: 2, gridRow: 1}}>
                    <IconButton
                      size="small"
                      onClick={() => displace(0, displaceStep)}
                      sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 1}}
                    >
                      <UpIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{gridColumn: 1, gridRow: 2}}>
                    <IconButton
                      size="small"
                      onClick={() => displace(-displaceStep, 0)}
                      sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 1}}
                    >
                      <LeftIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{gridColumn: 3, gridRow: 2}}>
                    <IconButton
                      size="small"
                      onClick={() => displace(displaceStep, 0)}
                      sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 1}}
                    >
                      <RightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{gridColumn: 2, gridRow: 3}}>
                    <IconButton
                      size="small"
                      onClick={() => displace(0, -displaceStep)}
                      sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 1}}
                    >
                      <DownIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={displaceStep}
                  onChange={(_, v) => v != null && setDisplaceStep(v)}
                  orientation="vertical"
                >
                  {STEPS.map((s) => (
                    <ToggleButton key={s} value={s} sx={{px: 1.5, py: 0.25}}>
                      {s} m
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Box>
          <Divider sx={{mt: 1}} />
          <Box sx={{display: 'flex', gap: 1, px: 1.5, py: 0.75, justifyContent: 'flex-end'}}>
            <Button
              size="small"
              variant={simState.emergency_latch ? 'contained' : 'outlined'}
              color={simState.emergency_latch ? 'error' : 'inherit'}
              onClick={() => setEmergency(!simState.emergency_latch)}
              sx={{textTransform: 'none', fontSize: '0.8rem'}}
            >
              {simState.emergency_latch ? 'Clear emergency' : 'Trigger emergency'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={moveToDock}
              sx={{textTransform: 'none', fontSize: '0.8rem'}}
            >
              {simState.charging ? 'Charging…' : 'Move to dock'}
            </Button>
          </Box>
          </>
        ) : (
          <>
            <Divider sx={{my: 1}} />
            <Typography variant="caption" color="text.secondary" sx={{px: 1.5, display: 'block', pb: 0.5}}>
              Simulator not detected — waiting for <code>sim/state/json</code>…
            </Typography>
          </>
        )}
      </Popover>
    </>
  );

  return createPortal(content, container);
}
