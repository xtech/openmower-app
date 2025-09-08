'use client';

import {useMapContext} from '@/contexts/MapContext';
import {MapData} from '@/stores/schemas';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {Box, type SxProps} from '@mui/material';
import bbox from '@turf/bbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import {RFullscreenControl, RMap} from 'maplibre-react-components';
import {useMemo, useState} from 'react';
import {DrawControl} from './DrawControl';
import {drawStyles} from './drawStyles';
import {FitToBoundsControl} from './FitBoundsControl';
import {mapStyles} from './mapStyles';
import {ToggleStyleControl} from './ToggleStyleControl';
import type {BBox} from './types';

interface MowerMapProps {
  mapData: MapData;
  sx: SxProps;
}

export function MowerMap({mapData, sx}: MowerMapProps) {
  const {id, editMode, features} = useMapContext();
  const [styleName, setStyleName] = useState<keyof typeof mapStyles>('white');
  const style = mapStyles[styleName];
  const toggleStyle = () => {
    setStyleName((prev) => (prev === 'white' ? 'satellite' : 'white'));
  };

  const bounds = useMemo(() => {
    if (features.features.length > 0) {
      return bbox(features) as BBox;
    } else {
      const {long, lat} = mapData.datum ?? {lat: 48.0, long: 11.0};
      return [long, lat, long, lat] as BBox;
    }
  }, [features, mapData.datum]);

  return (
    <Box sx={{...sx, overflow: 'hidden', position: 'relative'}}>
      <RMap
        key={id}
        id={id}
        // key={JSON.stringify(drawStyles)}
        style={{width: '100%', height: '100%'}}
        mapStyle={style}
        initialAttributionControl={false}
        maxZoom={24}
        initialBounds={bounds}
      >
        <RFullscreenControl />
        <FitToBoundsControl bounds={bounds} />
        <ToggleStyleControl onClick={toggleStyle} />
        <DrawControl
          position="top-left"
          features={features}
          displayControlsDefault={true}
          controls={{
            polygon: true,
            trash: true,
            uncombine_features: true,
            combine_features: true,
          }}
          styles={drawStyles}
          modes={{
            ...MapboxDraw.modes,
            static: StaticMode,
          }}
          // styles={[...splitPolygonDrawStyles(MapboxDraw.lib.theme)]}
          defaultMode={editMode ? 'simple_select' : 'static'}
          // onCreate={onUpdate}
          // onUpdate={onUpdate}
          // onDelete={onDelete}
          userProperties={true}
        />
      </RMap>
    </Box>
  );
}
