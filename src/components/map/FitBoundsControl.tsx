import {FocusIcon} from 'lucide-react';
import type {ControlPosition} from 'maplibre-gl';
import {useMap, useRControl} from 'maplibre-react-components';
import {useCallback} from 'react';
import {createPortal} from 'react-dom';
import type {BBox} from './types';

export function FitToBoundsControl({position = 'top-right', bounds}: {position?: ControlPosition; bounds: BBox}) {
  const {container} = useRControl({position});
  const map = useMap();
  const onClick = useCallback(() => {
    map.fitBounds(bounds, {padding: 10, duration: 1000});
  }, [bounds, map]);
  return createPortal(
    <button type="button" aria-hidden="true" onClick={onClick}>
      <FocusIcon />
    </button>,
    container,
  );
}
