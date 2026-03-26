'use client';

import {useMap} from '@/contexts/MapContext';
import {type MapData} from '@/stores/schemas';
import {datumToRelative, pointToAbsolute} from '@/utils/coordinates';
import {Box} from '@mui/material';
import {RMarker} from 'maplibre-react-components';
import {type ReactNode, useEffect, useMemo, useState} from 'react';

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

function metersToPixels(meters: number, zoom: number, latDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  const metersPerPx = (EARTH_CIRCUMFERENCE_M * Math.cos(latRad)) / (256 * Math.pow(2, zoom));
  return meters / metersPerPx;
}

interface MapMarkerProps {
  /** Relative position in the mower coordinate system */
  position: {x: number; y: number};
  /** Heading in radians (same convention as pose.heading) */
  heading: number;
  /** Physical size of the marker in meters (used for zoom-based scaling) */
  sizeM: number;
  datum: NonNullable<MapData['datum']>;
  className?: string;
  children: (sizePx: number) => ReactNode;
}

export default function MapMarker({position, heading, sizeM, datum, className, children}: MapMarkerProps) {
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

  const absPosition = useMemo(() => {
    const {long, lat} = datum;
    const utmDatum = datumToRelative([long, lat]);
    return pointToAbsolute(position, utmDatum);
  }, [datum, position]);

  const sizePx = useMemo(() => {
    const lat = absPosition[1];
    const raw = metersToPixels(sizeM, zoom, lat);
    return Math.round(raw);
  }, [sizeM, zoom, absPosition]);

  // Convert from mower heading (radians, 0 = east, CCW positive) to CSS rotation (degrees, 0 = north, CW positive)
  const headingDeg = 90 - (heading * 180) / Math.PI;

  return (
    <RMarker longitude={absPosition[0]} latitude={absPosition[1]} className={className}>
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
        {children(sizePx)}
      </Box>
    </RMarker>
  );
}
