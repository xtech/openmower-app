'use client';

import {displaySortKey, useMap, useMapboxDraw, useMapContext, useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {ExpandMore as ExpandMoreIcon} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {useEffect, useState} from 'react';
import {AsyncDialogProps} from 'react-dialog-async';
import MapDialog from '../MapDialog';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// Format a stored radian angle as a degrees string for the input (2 decimals, no trailing noise).
function radToDegString(rad: number): string {
  return String(Math.round(rad * RAD_TO_DEG * 100) / 100);
}

export function AreaSettingsDialog({isOpen, handleClose}: AsyncDialogProps) {
  const map = useMap();
  const draw = useMapboxDraw();
  const {features} = useMapContext();
  const selectedIds = useMapSelection();
  const [name, setName] = useState('');
  const [type, setType] = useState<AreaProps['type']>('draft');
  const [active, setActive] = useState(true);
  // Per-area mowing overrides — kept as strings so an empty field means "use the global default".
  const [outlineCount, setOutlineCount] = useState('');
  const [outlineOverlapCount, setOutlineOverlapCount] = useState('');
  const [outlineOffset, setOutlineOffset] = useState('');
  const [angleDeg, setAngleDeg] = useState('');
  // Advanced overrides are collapsed by default, expanded automatically when the area already has any set.
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Initialize form values when dialog opens or selected area changes
  useEffect(() => {
    if (selectedIds.length === 0 || !draw) return;
    const selectedArea = draw!.get(selectedIds[0]);
    const properties = selectedArea!.properties! as AreaProps;
    setName(properties.name ?? '');
    setType(properties.type ?? 'draft');
    setActive(properties.active ?? true);
    setOutlineCount(properties.outline_count != null ? String(properties.outline_count) : '');
    setOutlineOverlapCount(properties.outline_overlap_count != null ? String(properties.outline_overlap_count) : '');
    setOutlineOffset(properties.outline_offset != null ? String(properties.outline_offset) : '');
    setAngleDeg(properties.angle != null ? radToDegString(properties.angle) : '');
    setAdvancedExpanded(
      properties.outline_count != null ||
        properties.outline_overlap_count != null ||
        properties.outline_offset != null ||
        properties.angle != null,
    );
  }, [draw, selectedIds]);

  const overrideCount = [outlineCount, outlineOverlapCount, outlineOffset, angleDeg].filter(
    (v) => v.trim() !== '',
  ).length;

  const handleSave = () => {
    if (!map || !draw || selectedIds.length === 0) return;

    const feature = draw.get(selectedIds[0])!;
    const index = features.features.findIndex((f) => f.id === feature.id);
    const properties: Record<string, unknown> = {
      ...feature.properties,
      name,
      type,
      active,
      sort_key: displaySortKey(index, type, features.features),
    };

    // Per-area mowing overrides. An empty input (or a non-mowing area) removes the key entirely so
    // ROS falls back to the global config default. map.json stores angle in radians.
    const applyOverride = (key: string, raw: string, parse: (s: string) => number) => {
      const value = type === 'mow' ? parse(raw.trim()) : NaN;
      if (Number.isFinite(value)) {
        properties[key] = value;
      } else {
        delete properties[key];
      }
    };
    applyOverride('outline_count', outlineCount, (s) => parseInt(s, 10));
    applyOverride('outline_overlap_count', outlineOverlapCount, (s) => parseInt(s, 10));
    applyOverride('outline_offset', outlineOffset, (s) => parseFloat(s));
    applyOverride('angle', angleDeg, (s) => parseFloat(s) * DEG_TO_RAD);

    feature.properties = properties;
    draw.add(feature);
    map.fire(MapboxDraw.constants.events.UPDATE, {features: [feature]});

    handleClose();
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <MapDialog open={isOpen} onClose={() => handleClose()} fullWidth maxWidth="xs">
      <DialogTitle>Area Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as AreaProps['type'])}
            label="Type"
            MenuProps={{
              disablePortal: true,
            }}
          >
            <MenuItem value="mow">Mowing Area</MenuItem>
            <MenuItem value="nav">Navigation Area</MenuItem>
            <MenuItem value="obstacle">Obstacle</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
          label="Active"
          sx={{mt: 2}}
        />

        {type === 'mow' && (
          <Accordion
            expanded={advancedExpanded}
            onChange={(_, expanded) => setAdvancedExpanded(expanded)}
            disableGutters
            sx={{
              mt: 2,
              '&:before': {display: 'none'},
              borderRadius: '8px !important',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{bgcolor: 'background.paper', '&:hover': {bgcolor: 'action.hover'}, minHeight: 48}}
            >
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Advanced
                </Typography>
                {overrideCount > 0 && (
                  <Chip label={overrideCount} size="small" color="primary" sx={{height: 20, minWidth: 20}} />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{pt: 0}}>
              <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                Per-area overrides for the global mowing settings. Leave empty to use the global default.
              </Typography>
              <TextField
                label="Outline count"
                type="number"
                value={outlineCount}
                onChange={(e) => setOutlineCount(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Global default"
                inputProps={{min: 0, step: 1}}
                slotProps={{inputLabel: {shrink: true}}}
                helperText="How many outlines should the mower drive. It's not recommended to set this below 4."
              />
              <TextField
                label="Outline overlap count"
                type="number"
                value={outlineOverlapCount}
                onChange={(e) => setOutlineOverlapCount(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Global default"
                inputProps={{min: 0, step: 1}}
                slotProps={{inputLabel: {shrink: true}}}
                helperText="Number of outlines to overlap."
              />
              <TextField
                label="Outline offset (m)"
                type="number"
                value={outlineOffset}
                onChange={(e) => setOutlineOffset(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Global default"
                inputProps={{step: 'any'}}
                slotProps={{inputLabel: {shrink: true}}}
                helperText="Offset applied to the outline. Positive values move it inwards (i.e. safety margin)."
              />
              <TextField
                label="Mow angle (°)"
                type="number"
                value={angleDeg}
                onChange={(e) => setAngleDeg(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Auto-detect"
                inputProps={{min: -180, max: 180, step: 'any'}}
                slotProps={{inputLabel: {shrink: true}}}
                helperText="Fixed mowing direction (0° = east). Empty = auto-detect from the first 2 m of the outline."
              />
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose()}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={name === ''}>
          Save
        </Button>
      </DialogActions>
    </MapDialog>
  );
}
