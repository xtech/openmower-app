import {AreaProps} from '@/stores/schemas';
import {Feature, FeatureCollection, Polygon} from 'geojson';

export type AreaFeature = Feature<Polygon, AreaProps>;
export type AreaFeatureCollection = FeatureCollection<Polygon, AreaProps>;
