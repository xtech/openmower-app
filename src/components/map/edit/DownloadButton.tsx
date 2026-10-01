'use client';

import ControlButton from '@/components/map/ControlButton';
import { useMapboxDraw, useMapContext } from '@/contexts/MapContext';
import { CloudDownload as DownloadIcon } from '@mui/icons-material';

export function DownloadButton() {
  const draw = useMapboxDraw();
  const { datum } = useMapContext();

  const downloadFeatures = () => {
    if (!draw) return;

    const features = draw.getAll();
    const dataStr = JSON.stringify(features, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const timestamp = new Date()
      .toISOString()
      .replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/, '$1$2$3-$4$5$6');
    const exportFileDefaultName = `openmower-map-${timestamp}.geojson`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <ControlButton
      position="bottom-right"
      icon={DownloadIcon}
      title="Download map"
      onClick={downloadFeatures}
      hidden={!draw || !datum}
    />
  );
}
