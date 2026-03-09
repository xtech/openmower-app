import MapboxDraw, {type DrawMode} from '@mapbox/mapbox-gl-draw';
import {Draft} from 'immer';
import {Feature, FeatureCollection} from 'geojson';
import {useMap as useMapLibreMap} from 'maplibre-react-components';
import {createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from 'react';
import {Updater, useImmer} from 'use-immer';

type SetFeatures = (recipe: FeatureCollection | ((draft: Draft<FeatureCollection>) => void), userChange?: boolean) => void;

interface MapContextType {
  id: string;
  features: FeatureCollection;
  setFeatures: SetFeatures;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  drawMode: DrawMode;
  setDrawMode: Dispatch<SetStateAction<DrawMode>>;
  drawWorkflow: Workflow | null;
  setDrawWorkflow: Updater<Workflow | null>;
  trashEnabled: boolean;
  setTrashEnabled: Dispatch<SetStateAction<boolean>>;
  hasUnsavedChanges: boolean;
}

interface SplitPolygonWorkflow {
  type: 'split_polygon';
  areaId: string;
}

type Workflow = SplitPolygonWorkflow;

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapContextProvider = ({id, children}: {id: string; children: React.ReactNode}) => {
  // Note that here is where we keep the correct order of features (mapbox-gl-draw doesn't maintain it).
  const [features, setFeaturesImmer] = useImmer<FeatureCollection>({type: 'FeatureCollection', features: []});
  const [editMode, setEditMode] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(MapboxDraw.constants.modes.STATIC);
  const [drawWorkflow, setDrawWorkflow] = useImmer<Workflow | null>(null);
  const [trashEnabled, setTrashEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setFeatures = useCallback<SetFeatures>(
    (recipe, userChange = true) => {
      setFeaturesImmer(recipe as Parameters<typeof setFeaturesImmer>[0]);
      setHasUnsavedChanges(userChange);
    },
    [setFeaturesImmer],
  );

  return (
    <MapContext
      value={{
        id,
        features,
        setFeatures,
        editMode,
        setEditMode,
        drawMode,
        setDrawMode,
        drawWorkflow,
        setDrawWorkflow,
        trashEnabled,
        setTrashEnabled,
        hasUnsavedChanges,
      }}
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
