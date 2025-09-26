'use client';

import {useMap, useMapboxDraw, useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  Button,
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
} from '@mui/material';
import {useEffect, useState} from 'react';
import MapDialog from './MapDialog';

interface AreaSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AreaSettingsDialog({open, onClose}: AreaSettingsDialogProps) {
  const map = useMap();
  const draw = useMapboxDraw();
  const selectedIds = useMapSelection();
  const [name, setName] = useState('');
  const [type, setType] = useState<AreaProps['type']>('draft');
  const [active, setActive] = useState(true);

  // Initialize form values when dialog opens or selected area changes
  useEffect(() => {
    if (selectedIds.length === 0 || !draw) return;
    const selectedArea = draw!.get(selectedIds[0]);
    const properties = selectedArea!.properties! as AreaProps;
    setName(properties.name ?? '');
    setType(properties.type ?? 'draft');
    setActive(properties.active ?? true);
  }, [draw, selectedIds]);

  const handleSave = () => {
    if (!map || !draw || selectedIds.length === 0) return;

    const feature = draw.get(selectedIds[0])!;
    feature.properties = {
      name,
      type,
      active,
    };
    draw.add(feature);
    map.fire(MapboxDraw.constants.events.UPDATE, {features: [feature]});

    onClose();
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <MapDialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={name === ''}>
          Save
        </Button>
      </DialogActions>
    </MapDialog>
  );
}
