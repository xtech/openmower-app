import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {FeatureCollection} from 'geojson';
import {useMap as useMapLibreMap} from 'maplibre-react-components';
import {createContext, Dispatch, SetStateAction, useContext, useState} from 'react';
import {Updater, useImmer} from 'use-immer';

interface MapContextType {
  id: string;
  features: FeatureCollection;
  setFeatures: Updater<FeatureCollection>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapContextProvider = ({id, children}: {id: string; children: React.ReactNode}) => {
  const [features, setFeatures] = useImmer<FeatureCollection>({type: 'FeatureCollection', features: []});
  const [editMode, setEditMode] = useState(false);
  return <MapContext value={{id, features, setFeatures, editMode, setEditMode}}>{children}</MapContext>;
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
