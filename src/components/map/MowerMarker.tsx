'use client';

import {useMap} from '@/contexts/MapContext';
import {useSelectedMower} from '@/stores/mowersStore';
import {fallbackDatum, type MapData} from '@/stores/schemas';
import {datumToRelative, pointToAbsolute} from '@/utils/coordinates';
import {Box} from '@mui/material';
import {RMarker} from 'maplibre-react-components';
import {useEffect, useMemo, useState} from 'react';

const MOWER_LENGTH_M = 0.55;
const MIN_SIZE_PX = 16;
const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

function metersToPixels(meters: number, zoom: number, latDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  const metersPerPx = (EARTH_CIRCUMFERENCE_M * Math.cos(latRad)) / (256 * Math.pow(2, zoom));
  return meters / metersPerPx;
}

interface MowerMarkerProps {
  datum: MapData['datum'];
}

export default function MowerMarker({datum}: MowerMarkerProps) {
  const pose = useSelectedMower((s) => s?.state.pose);
  const map = useMap();
  const [zoom, setZoom] = useState<number>(() => map?.getZoom() ?? 18);

  useEffect(() => {
    if (!map) return;
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom', onZoom);
    return () => {
      map.off('zoom', onZoom);
    };
  }, [map]);

  const position = useMemo(() => {
    if (!pose) return null;
    const {long, lat} = datum ?? fallbackDatum;
    const utmDatum = datumToRelative([long, lat]);
    return pointToAbsolute({x: pose.x, y: pose.y}, utmDatum);
  }, [datum, pose]);

  const sizePx = useMemo(() => {
    const lat = position ? position[1] : (datum ?? fallbackDatum).lat;
    const raw = metersToPixels(MOWER_LENGTH_M, zoom, lat);
    return Math.round(Math.max(raw, MIN_SIZE_PX));
  }, [zoom, position, datum]);

  if (!position || !pose) return null;

  const headingDeg = 90 - (pose.heading * 180) / Math.PI;
  const markerColor = pose.pos_accuracy === 0 ? '#F44336' : '#4CAF50';

  return (
    <RMarker longitude={position[0]} latitude={position[1]}>
      <Box
        sx={{
          width: sizePx,
          height: sizePx,
          transform: `rotate(${headingDeg}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={sizePx} height={sizePx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arrow pointing up (0deg = north/forward) */}
          <path
            d="M16 2 L26 28 L16 22 L6 28 Z"
            fill={markerColor}
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    </RMarker>
  );
}
