'use client';

import {AreaProps} from '@/stores/schemas';
import {getBiggestArea} from '@/utils/area-utils';
import {Typography} from '@mui/material';
import type {Feature, Polygon} from 'geojson';
import {useState} from 'react';
import {AsyncDialogProps} from 'react-dialog-async';
import {AreaOperationDialog, AreaSelection} from './AreaOperationDialog';

interface MergeDialogProps {
  selectedAreas: Feature<Polygon, AreaProps>[];
}

export default function MergeDialog({open, handleClose, data}: AsyncDialogProps<MergeDialogProps, string>) {
  const {selectedAreas} = data;
  const [targetAreaId, setTargetAreaId] = useState<string>(() => getBiggestArea(selectedAreas)!.id as string);
  return (
    <AreaOperationDialog open={open} handleClose={handleClose} confirmText="Merge areas" response={targetAreaId}>
      <Typography variant="subtitle1">Merge areas into:</Typography>
      <AreaSelection areas={selectedAreas} selectedAreaId={targetAreaId} setSelectedAreaId={setTargetAreaId} />
      <Typography variant="body2" color="text.secondary">
        The attributes of this area (e.g. name and type) will be preserved, the other areas will be removed.
      </Typography>
    </AreaOperationDialog>
  );
}
