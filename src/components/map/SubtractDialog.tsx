'use client';

import {AreaProps} from '@/stores/schemas';
import {getBiggestArea} from '@/utils/area-utils';
import {FormControlLabel, Switch, Typography} from '@mui/material';
import type {Feature, Polygon} from 'geojson';
import {useState} from 'react';
import {AsyncDialogProps} from 'react-dialog-async';
import {AreaOperationDialog, AreaSelection} from './AreaOperationDialog';

interface SubtractDialogProps {
  selectedAreas: Feature<Polygon, AreaProps>[];
}

export default function SubtractDialog({
  open,
  handleClose,
  data,
}: AsyncDialogProps<SubtractDialogProps, [string, boolean]>) {
  const {selectedAreas} = data;
  const [targetAreaId, setTargetAreaId] = useState<string>(() => getBiggestArea(selectedAreas)!.id as string);
  const [keepAllAreas, setKeepAllAreas] = useState(true);
  return (
    <AreaOperationDialog
      open={open}
      handleClose={handleClose}
      confirmText="Subtract areas"
      response={[targetAreaId, keepAllAreas]}
    >
      <Typography variant="subtitle1">Make this area smaller:</Typography>
      <AreaSelection areas={selectedAreas} selectedAreaId={targetAreaId} setSelectedAreaId={setTargetAreaId} />
      <FormControlLabel
        control={<Switch checked={keepAllAreas} onChange={(e) => setKeepAllAreas(e.target.checked)} />}
        label="Keep all areas"
        sx={{}}
      />
      <Typography variant="body2" color="text.secondary" sx={{height: '2lh'}}>
        {keepAllAreas
          ? "Only remove the parts of the selected area that overlap with the other areas. Don't remove any areas."
          : 'Cut the overlapping parts, then remove the other areas.'}
      </Typography>
    </AreaOperationDialog>
  );
}
