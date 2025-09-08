import {useMapContext} from '@/contexts/MapContext';
import type {MapboxDrawOptions} from '@mapbox/mapbox-gl-draw';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type {FeatureCollection} from 'geojson';
import type {ControlPosition} from 'maplibre-gl';
import {useControl} from 'maplibre-react-components';
import {useEffect} from 'react';

const constants = MapboxDraw.constants.classes as Record<string, string>;
constants.CONTROL_BASE = 'maplibregl-ctrl';
constants.CONTROL_PREFIX = 'maplibregl-ctrl-';
constants.CONTROL_GROUP = 'maplibregl-ctrl-group';

export function DrawControl({
  position = 'top-left',
  features,
  ...props
}: MapboxDrawOptions & {position?: ControlPosition; features: FeatureCollection}) {
  const {editMode} = useMapContext();

  const draw = useControl({
    position,
    factory: () => new MapboxDraw(props),
  }) as MapboxDraw;

  useEffect(() => {
    draw.set(features);
  }, [draw, features]);

  useEffect(() => {
    if (editMode) {
      draw.changeMode('simple_select');
    } else {
      draw.changeMode('static');
    }
  }, [draw, editMode]);

  return null;
}
