import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {useMap} from 'maplibre-react-components';

export function useMapboxDraw(): MapboxDraw | null;
export function useMapboxDraw(id: string): MapboxDraw | null;
export function useMapboxDraw(optionalId?: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore optionalId expected type: string | undefined
  const map = useMap(optionalId);
  return map?._controls.find((control) => control instanceof MapboxDraw) ?? null;
}
