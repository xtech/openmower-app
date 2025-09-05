'use client';

import {useMapboxDraw} from '@/contexts/DrawContext';
import {Download as DownloadIcon} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';

interface DownloadButtonProps extends ButtonProps {
  mapId: string;
}

export function DownloadButton({mapId, ...buttonProps}: DownloadButtonProps) {
  const draw = useMapboxDraw(mapId);

  const downloadFeatures = () => {
    if (!draw) return;

    const features = draw.getAll();
    const dataStr = JSON.stringify(features, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `map-features-${new Date().toISOString().split('T')[0]}.geojson`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Button
      {...buttonProps}
      startIcon={<DownloadIcon />}
      onClick={downloadFeatures}
      disabled={buttonProps.disabled || !draw}
      sx={{borderRadius: 2, fontWeight: 600}}
    >
      Download
    </Button>
  );
}
