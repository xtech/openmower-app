'use client';

import {getFeatureDescription} from '@/utils/area-converter';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import type {Feature, FeatureCollection} from 'geojson';
import {useState} from 'react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  features: FeatureCollection | null;
  onImport: (selectedFeatures: Feature[], clearExisting: boolean) => void;
}

export function UploadModal({open, onClose, features, onImport}: ImportModalProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set(features?.features.keys().toArray()));
  const [clearExisting, setClearExisting] = useState(true);
  const [selectAll, setSelectAll] = useState(true);

  if (!features) return null;

  const handleFeatureToggle = (index: number) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFeatures(newSelected);
    setSelectAll(newSelected.size === features.features.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(features.features.map((_, index) => index)));
    }
    setSelectAll(!selectAll);
  };

  const handleImport = () => {
    const featuresToImport = features.features.filter((_, index) => selectedFeatures.has(index));
    onImport(featuresToImport, clearExisting);
    onClose();
    setSelectedFeatures(new Set());
    setSelectAll(false);
    setClearExisting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Import Features
        <Typography variant="subtitle1" component="div">
          Select which features to import from the uploaded GeoJSON file
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{mb: 3}}>
          <FormControlLabel
            control={
              <Switch checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} color="warning" />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="500">
                  Remove existing features
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Clear all current features before importing new ones
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{mb: 2}}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAll}
                indeterminate={selectedFeatures.size > 0 && selectedFeatures.size < features.features.length}
              />
            }
            label={`Select All (${features.features.length} features)`}
          />
        </Box>

        <List
          sx={{
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          {features.features.map((feature, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => handleFeatureToggle(index)}>
                <ListItemIcon>
                  <Checkbox
                    checked={selectedFeatures.has(index)}
                    onChange={() => handleFeatureToggle(index)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={getFeatureDescription(feature)}
                  secondary={feature.properties?.description || `Feature ${index + 1}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{px: 3, pb: 3}}>
        <Button onClick={onClose} sx={{borderRadius: 2}}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={selectedFeatures.size === 0}
          sx={{borderRadius: 2, fontWeight: 600}}
        >
          Import {selectedFeatures.size} Feature{selectedFeatures.size !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
