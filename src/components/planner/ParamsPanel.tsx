'use client';

import {Box, Checkbox, FormControlLabel, MenuItem, Stack, TextField,
  Typography} from '@mui/material';

const NUM_FIELDS: [string, string][] = [
  ['robot_width', 'Robot width (m)'],
  ['tool_width', 'Tool width (m)'],
  ['headland_rounds', 'Headland rounds'],
  ['fill_overlap_rounds', 'Fill overlap rounds'],
  ['min_turning_radius', 'Min turn radius (m)'],
  ['disk_lateral_offset', 'Disk lateral offset (m)'],
  ['mow_pass_margin', 'Mow pass margin (m)'],
  ['bend_max_dev', 'Bend max deviation (m)'],
  ['merge_max_gap', 'Merge max gap (m)'],
  ['transit_wall_fade', 'Transit wall fade (m)'],
  ['transit_wall_risk', 'Transit wall risk'],
  ['transit_grid_step', 'Transit grid step (m)'],
];

export type Params = Record<string, unknown>;

export default function ParamsPanel({
  params, onChange,
}: {
  params: Params;
  onChange: (next: Params) => void;
}) {
  const set = (k: string, v: unknown) => onChange({...params, [k]: v});
  const autoAngle = params.angle_deg == null;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Parameters
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 1}}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={autoAngle}
              onChange={(e) => set('angle_deg', e.target.checked ? null : 0)}
            />
          }
          label="Auto angle"
        />
        {!autoAngle && (
          <TextField
            label="Angle (°)"
            type="number"
            size="small"
            value={params.angle_deg ?? 0}
            onChange={(e) => set('angle_deg', parseFloat(e.target.value))}
            sx={{width: 110}}
          />
        )}
      </Stack>

      <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1}}>
        {NUM_FIELDS.map(([k, label]) => (
          <TextField
            key={k}
            label={label}
            type="number"
            size="small"
            value={params[k] ?? ''}
            onChange={(e) => set(k, parseFloat(e.target.value))}
          />
        ))}
      </Box>

      <Stack direction="row" spacing={1} sx={{mt: 1}}>
        <TextField
          select label="Ring order" size="small" fullWidth
          value={(params.ring_order as string) ?? 'first'}
          onChange={(e) => set('ring_order', e.target.value)}
        >
          <MenuItem value="first">obstacles first</MenuItem>
          <MenuItem value="tour">mixed tour</MenuItem>
        </TextField>
        <TextField
          select label="Route solver" size="small" fullWidth
          value={(params.order as string) ?? 'greedy'}
          onChange={(e) => set('order', e.target.value)}
        >
          <MenuItem value="greedy">greedy + DP</MenuItem>
          <MenuItem value="ortools">OR-Tools</MenuItem>
        </TextField>
      </Stack>
    </Box>
  );
}
