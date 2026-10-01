'use client';

import ControlButton from '@/components/map/ControlButton';
import { useFitToBounds, useMapboxDraw, useMapContext, withDisplaySortKeys } from '@/contexts/MapContext';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { featureCollection } from '@turf/helpers';
import type { FeatureCollection } from 'geojson';
import { useRef } from 'react';
import { useDialog } from 'react-dialog-async';
import { UploadModal } from './UploadModal';

export function UploadButton() {
  const draw = useMapboxDraw();
  const { features, setFeatures, editMode, setEditMode } = useMapContext();
  const fitToBounds = useFitToBounds();
  const uploadModal = useDialog(UploadModal);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (event.target) event.target.value = '';

    const text = await file.text();
    let geojson: FeatureCollection;
    try {
      geojson = JSON.parse(text);
    } catch {
      console.error('Error parsing GeoJSON');
      alert('Invalid GeoJSON file');
      return;
    }

    const result = await uploadModal.open(geojson);
    if (!result || !draw) return;

    if (!editMode) setEditMode(true);

    const existingFeatures = result.clearExisting ? [] : features.features;
    const merged = featureCollection([...existingFeatures, ...result.features]);
    draw.set(withDisplaySortKeys(merged));
    setFeatures(merged);
    requestAnimationFrame(() => fitToBounds());
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <ControlButton
        position="bottom-right"
        icon={UploadIcon}
        title="Upload map"
        onClick={handleUploadClick}
        hidden={!draw}
      />
    </>
  );
}
