import { useMapContext, withDisplaySortKeys } from '@/contexts/MapContext';
import type {
  DrawActionableEvent,
  DrawCreateEvent,
  DrawDeleteEvent,
  DrawModeChangeEvent,
  DrawUpdateEvent,
  MapboxDrawOptions,
} from '@mapbox/mapbox-gl-draw';
import MapboxDraw, { type DrawMode } from '@mapbox/mapbox-gl-draw';
import type { Feature, FeatureCollection } from 'geojson';
import type { ControlPosition, IControl } from 'maplibre-gl';
import { useControl, useMap } from 'maplibre-react-components';
import { useCallback, useEffect } from 'react';

const constants = MapboxDraw.constants.classes as Record<string, string>;
constants.CONTROL_BASE = 'maplibregl-ctrl';
constants.CONTROL_PREFIX = 'maplibregl-ctrl-';
constants.CONTROL_GROUP = 'maplibregl-ctrl-group';
constants.CANVAS = 'maplibregl-canvas';

export function DrawControl({
  position = 'top-left',
  onFeaturesCreated,
  ...props
}: MapboxDrawOptions & { position?: ControlPosition; onFeaturesCreated?: (features: Feature[]) => void }) {
  const { editMode, setFeatures, setDrawMode, setTrashEnabled } = useMapContext();
  const map = useMap();
  const draw = useControl({
    position,
    factory: () => {
      const draw = new MapboxDraw(props);
      const originalChangeMode = draw.changeMode.bind(draw);
      draw.changeMode = (mode: DrawMode, options = {}) => {
        // @ts-expect-error don't care about the variants
        originalChangeMode(mode, options);
        setDrawMode(mode);
        return draw;
      };
      return draw as unknown as IControl;
    },
  }) as unknown as MapboxDraw;

  const onDrawChange = useCallback(
    (e: DrawCreateEvent | DrawUpdateEvent | DrawDeleteEvent) => {
      if (e.type === 'draw.create') {
        setFeatures((draft) => {
          draft.features.push(...e.features);
          draw.set(withDisplaySortKeys(draft as FeatureCollection));
        });
        onFeaturesCreated?.(e.features);
      } else if (e.type === 'draw.update') {
        setFeatures((draft) => {
          for (const updatedFeature of e.features) {
            const idx = draft.features.findIndex((f) => f.id === updatedFeature.id);
            if (idx !== -1) {
              draft.features[idx] = updatedFeature;
            }
          }
          draw.set(withDisplaySortKeys(draft as FeatureCollection));
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
    [setFeatures, onFeaturesCreated],
  );

  const onModeChange = useCallback(
    (e: DrawModeChangeEvent) => {
      setDrawMode(e.mode);
    },
    [setDrawMode],
  );

  const onActionableChange = useCallback(
    (e: DrawActionableEvent) => {
      setTrashEnabled(e.actions.trash);
    },
    [setTrashEnabled],
  );

  useEffect(() => {
    if (map) {
      map.on(MapboxDraw.constants.events.CREATE, onDrawChange);
      map.on(MapboxDraw.constants.events.UPDATE, onDrawChange);
      map.on(MapboxDraw.constants.events.DELETE, onDrawChange);
      map.on(MapboxDraw.constants.events.MODE_CHANGE, onModeChange);
      map.on(MapboxDraw.constants.events.ACTIONABLE, onActionableChange);
      return () => {
        map.off(MapboxDraw.constants.events.CREATE, onDrawChange);
        map.off(MapboxDraw.constants.events.UPDATE, onDrawChange);
        map.off(MapboxDraw.constants.events.DELETE, onDrawChange);
        map.off(MapboxDraw.constants.events.MODE_CHANGE, onModeChange);
        map.off(MapboxDraw.constants.events.ACTIONABLE, onActionableChange);
      };
    }
  }, [map, onDrawChange, onModeChange, onActionableChange]);

  useEffect(() => {
    if (editMode) {
      draw.changeMode('simple_select');
    } else {
      draw.changeMode('static');
    }
  }, [draw, editMode]);

  return null;
}
