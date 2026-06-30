import {create} from 'zustand';
import {persist} from 'zustand/middleware';

interface MapDisplayStore {
  showSatelliteLayer: boolean;
  showTrackLayer: boolean;
  showPlannedPath: boolean;
  showAreaList: boolean;
  selectedJobId: string | null;
  setShowSatelliteLayer: (v: boolean) => void;
  setShowTrackLayer: (v: boolean) => void;
  setShowPlannedPath: (v: boolean) => void;
  setShowAreaList: (v: boolean) => void;
  setSelectedJobId: (v: string | null) => void;
}

export const useMapDisplayStore = create<MapDisplayStore>()(
  persist(
    (set) => ({
      showSatelliteLayer: false,
      showTrackLayer: true,
      showPlannedPath: false,
      showAreaList: true,
      selectedJobId: null,
      setShowSatelliteLayer: (v) => set({showSatelliteLayer: v}),
      setShowTrackLayer: (v) => set({showTrackLayer: v}),
      setShowPlannedPath: (v) => set({showPlannedPath: v}),
      setShowAreaList: (v) => set({showAreaList: v}),
      setSelectedJobId: (v) => set({selectedJobId: v}),
    }),
    {name: 'map-display'},
  ),
);
