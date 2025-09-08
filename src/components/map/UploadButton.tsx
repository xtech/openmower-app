'use client';

import {useMapboxDraw} from '@/contexts/MapContext';
import {Upload as UploadIcon} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';
import type {Feature, FeatureCollection} from 'geojson';
import {useRef, useState} from 'react';
import {UploadModal} from './UploadModal';

export function UploadButton(buttonProps: ButtonProps) {
  const draw = useMapboxDraw();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [pendingFeatures, setPendingFeatures] = useState<FeatureCollection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        setPendingFeatures(geojson);
        setImportModalOpen(true);
      } catch (error) {
        console.error('Error parsing GeoJSON:', error);
        alert('Invalid GeoJSON file');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleImportFeatures = (selectedFeatures: Feature[], clearExisting: boolean) => {
    if (!draw) return;

    if (clearExisting) {
      draw.deleteAll();
    }

    // Add each selected feature to the map
    selectedFeatures.forEach((feature) => {
      draw.add(feature);
    });
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        onChange={handleFileUpload}
        style={{display: 'none'}}
      />

      <Button
        {...buttonProps}
        startIcon={<UploadIcon />}
        onClick={handleUploadClick}
        disabled={buttonProps.disabled || !draw}
      >
        Upload
      </Button>

      {/* Import Modal */}
      <UploadModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        features={pendingFeatures}
        onImport={handleImportFeatures}
      />
    </>
  );
}
