import MapboxDraw, {type DrawMode} from '@mapbox/mapbox-gl-draw';
import {Feature, FeatureCollection} from 'geojson';
import {useMap as useMapLibreMap} from 'maplibre-react-components';
import {createContext, Dispatch, SetStateAction, useContext, useEffect, useState} from 'react';
import {Updater, useImmer} from 'use-immer';

interface MapContextType {
  id: string;
  features: FeatureCollection;
  setFeatures: Updater<FeatureCollection>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  drawMode: DrawMode;
  setDrawMode: Dispatch<SetStateAction<DrawMode>>;
  trashEnabled: boolean;
  setTrashEnabled: Dispatch<SetStateAction<boolean>>;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapContextProvider = ({id, children}: {id: string; children: React.ReactNode}) => {
  // Note that here is where we keep the correct order of features (mapbox-gl-draw doesn't maintain it).
  const [features, setFeatures] = useImmer<FeatureCollection>({type: 'FeatureCollection', features: []});
  const [editMode, setEditMode] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(MapboxDraw.constants.modes.STATIC);
  const [trashEnabled, setTrashEnabled] = useState(false);
  return (
    <MapContext
      value={{id, features, setFeatures, editMode, setEditMode, drawMode, setDrawMode, trashEnabled, setTrashEnabled}}
    >
      {children}
    </MapContext>
  );
};

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMapContext() must be used within a MapContextProvider');
  }
  return ctx;
}

export function useMap() {
  const {id} = useMapContext();
  return useMapLibreMap(id);
}

export function useMapboxDraw() {
  const map = useMap();
  return map?._controls.find((control) => control instanceof MapboxDraw) ?? null;
}

export function useMapSelection() {
  const map = useMap();
  const draw = useMapboxDraw();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    if (map && draw) {
      setSelectedIds(draw.getSelectedIds());
      const updateSelectedIds = ({features}: {features: Feature[]}) => {
        setSelectedIds(features.map((feature) => feature.id as string));
      };
      map?.on('draw.selectionchange', updateSelectedIds);
      return () => {
        map.off('draw.selectionchange', updateSelectedIds);
      };
    } else {
      setSelectedIds([]);
    }
  }, [map, draw]);
  return selectedIds;
}
