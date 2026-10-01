import { fallbackDatum, type Datum } from '@/stores/schemas';
import { detectFeatureIssues, type MapIssue } from '@/utils/map-issues';
import MapboxDraw, { type DrawMode } from '@mapbox/mapbox-gl-draw';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import { Feature, FeatureCollection } from 'geojson';
import { Draft, produce } from 'immer';
import { useMap as useMapLibreMap } from 'maplibre-react-components';
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Updater, useImmer } from 'use-immer';

type Bounds = [west: number, south: number, east: number, north: number];

function useBounds(features: FeatureCollection, datum: Datum) {
  const previousBoundsRef = useRef<Bounds | null>(null);
  return useMemo(() => {
    const newBounds: Bounds =
      features.features.length > 0 ? (bbox(features) as Bounds) : [datum.long, datum.lat, datum.long, datum.lat];

    const previous = previousBoundsRef.current;
    if (previous && boundsEqual(previous, newBounds)) {
      return previous;
    }

    previousBoundsRef.current = newBounds;
    return newBounds;
  }, [features]);
}

function boundsEqual(a: Bounds, b: Bounds): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

type SetFeatures = (
  recipe: FeatureCollection | ((draft: Draft<FeatureCollection>) => void),
  userChange?: boolean,
) => void;

interface MapContextType {
  id: string;
  datum: Datum | null;
  datumOrFallback: Datum;
  setDatum: Dispatch<SetStateAction<Datum | null>>;
  features: FeatureCollection;
  setFeatures: SetFeatures;
  bounds: Bounds;
  issues: MapIssue[];
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  drawMode: DrawMode;
  setDrawMode: Dispatch<SetStateAction<DrawMode>>;
  drawWorkflow: Workflow | null;
  setDrawWorkflow: Updater<Workflow | null>;
  trashEnabled: boolean;
  setTrashEnabled: Dispatch<SetStateAction<boolean>>;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => FeatureCollection | null;
  redo: () => FeatureCollection | null;
  hoveredId: string | null;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
}

interface SplitPolygonWorkflow {
  type: 'split_polygon';
  areaId: string;
}

type Workflow = SplitPolygonWorkflow;

const MAX_HISTORY_STEPS = 10;

export function displaySortKey(idx: number, type: string | undefined, features: Feature[]): number {
  return (type === 'obstacle' ? features.length : 0) + idx;
}

export function withDisplaySortKeys(fc: FeatureCollection): FeatureCollection {
  return produce(fc, (draft) => {
    draft.features.forEach((f, i) => {
      f.properties ??= {};
      f.properties.sort_key = displaySortKey(i, f.properties.type, fc.features);
    });
  });
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapContextProvider = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const [datum, setDatum] = useState<Datum | null>(null);
  const datumOrFallback = datum ?? fallbackDatum;
  // Note that here is where we keep the correct order of features (mapbox-gl-draw doesn't maintain it).
  const [features, setFeaturesImmer] = useImmer<FeatureCollection>(featureCollection([]));
  const [editMode, setEditMode] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(MapboxDraw.constants.modes.STATIC);
  const [drawWorkflow, setDrawWorkflow] = useImmer<Workflow | null>(null);
  const [trashEnabled, setTrashEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [past, setPast] = useState<FeatureCollection[]>([]);
  const [future, setFuture] = useState<FeatureCollection[]>([]);

  const bounds = useBounds(features, datumOrFallback);
  const issues = useMemo(() => features.features.flatMap(detectFeatureIssues), [features]);

  // Keep a ref to the current features so undo/redo callbacks don't go stale.
  const featuresRef = useRef(features);
  featuresRef.current = features;

  const setFeatures = useCallback<SetFeatures>(
    (recipe, userChange = true) => {
      if (userChange) {
        setPast((prev) => [...prev, featuresRef.current].slice(-MAX_HISTORY_STEPS));
        setFuture([]);
      }
      setFeaturesImmer(recipe as Parameters<typeof setFeaturesImmer>[0]);
      setHasUnsavedChanges(userChange);
    },
    [setFeaturesImmer],
  );

  const undo = useCallback((): FeatureCollection | null => {
    const prev = past;
    if (prev.length === 0) return null;
    const snapshot = prev[prev.length - 1];
    setPast(prev.slice(0, -1));
    setFuture((f) => [featuresRef.current, ...f]);
    setFeaturesImmer(snapshot);
    setHasUnsavedChanges(prev.length > 1);
    return snapshot;
  }, [past, setFeaturesImmer]);

  const redo = useCallback((): FeatureCollection | null => {
    const prev = future;
    if (prev.length === 0) return null;
    const snapshot = prev[0];
    setFuture(prev.slice(1));
    setPast((p) => [...p, featuresRef.current].slice(-MAX_HISTORY_STEPS));
    setFeaturesImmer(snapshot);
    setHasUnsavedChanges(true);
    return snapshot;
  }, [future, setFeaturesImmer]);

  useEffect(() => {
    if (!editMode) {
      setPast([]);
      setFuture([]);
    }
  }, [editMode]);

  return (
    <MapContext
      value={{
        id,
        datum,
        datumOrFallback,
        setDatum,
        features,
        setFeatures,
        bounds,
        issues,
        editMode,
        setEditMode,
        drawMode,
        setDrawMode,
        drawWorkflow,
        setDrawWorkflow,
        trashEnabled,
        setTrashEnabled,
        hasUnsavedChanges,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        undo,
        redo,
        hoveredId,
        setHoveredId,
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
  const { id } = useMapContext();
  return useMapLibreMap(id);
}

export function useMapboxDraw() {
  const map = useMap();
  return map?._controls.find((control) => control instanceof MapboxDraw) ?? null;
}

export function useFitToBounds() {
  const map = useMap();
  const { bounds } = useMapContext();
  return useEffectEvent((immediate: boolean = false, padding = { top: 10, bottom: 10, left: 60, right: 60 }) => {
    map?.fitBounds(bounds, { padding, duration: immediate ? 0 : 1000 });
  });
}

export function useMapHover(): [string | null, Dispatch<SetStateAction<string | null>>] {
  const { hoveredId, setHoveredId } = useMapContext();
  return [hoveredId, setHoveredId];
}

export function useMapSelection() {
  const map = useMap();
  const draw = useMapboxDraw();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    if (map && draw) {
      setSelectedIds(draw.getSelectedIds());
      const updateSelectedIds = ({ features }: { features: Feature[] }) => {
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
