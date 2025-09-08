import {useMapContext} from '@/contexts/MapContext';
import type {DrawCreateEvent, DrawDeleteEvent, DrawUpdateEvent, MapboxDrawOptions} from '@mapbox/mapbox-gl-draw';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type {ControlPosition} from 'maplibre-gl';
import {useControl, useMap} from 'maplibre-react-components';
import {useCallback, useEffect} from 'react';

const constants = MapboxDraw.constants.classes as Record<string, string>;
constants.CONTROL_BASE = 'maplibregl-ctrl';
constants.CONTROL_PREFIX = 'maplibregl-ctrl-';
constants.CONTROL_GROUP = 'maplibregl-ctrl-group';

export function DrawControl({position = 'top-left', ...props}: MapboxDrawOptions & {position?: ControlPosition}) {
  const {editMode, setFeatures} = useMapContext();
  const map = useMap();
  const draw = useControl({
    position,
    factory: () => new MapboxDraw(props),
  }) as MapboxDraw;

  const onDrawChange = useCallback(
    (e: DrawCreateEvent | DrawUpdateEvent | DrawDeleteEvent) => {
      if (e.type === 'draw.create') {
        setFeatures((draft) => {
          draft.features.push(...e.features);
        });
      } else if (e.type === 'draw.update') {
        setFeatures((draft) => {
          for (const updatedFeature of e.features) {
            const idx = draft.features.findIndex((f) => f.id === updatedFeature.id);
            if (idx !== -1) {
              draft.features[idx] = updatedFeature;
            }
          }
        });
      } else if (e.type === 'draw.delete') {
        setFeatures((draft) => {
          for (const deletedFeature of e.features) {
            const idx = draft.features.findIndex((f) => f.id === deletedFeature.id);
            if (idx !== -1) {
              draft.features.splice(idx, 1);
            }
          }
        });
      }
    },
    [setFeatures],
  );

  useEffect(() => {
    if (map) {
      map.on(MapboxDraw.constants.events.CREATE, onDrawChange);
      map.on(MapboxDraw.constants.events.UPDATE, onDrawChange);
      map.on(MapboxDraw.constants.events.DELETE, onDrawChange);
      return () => {
        map.off(MapboxDraw.constants.events.CREATE, onDrawChange);
        map.off(MapboxDraw.constants.events.UPDATE, onDrawChange);
        map.off(MapboxDraw.constants.events.DELETE, onDrawChange);
      };
    }
  }, [map, onDrawChange]);

  useEffect(() => {
    if (editMode) {
      draw.changeMode('simple_select');
    } else {
      draw.changeMode('static');
    }
  }, [draw, editMode]);

  return null;
}
