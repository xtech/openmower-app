import {generateId} from '@/utils/area-utils';
import mqtt, {MqttClient} from 'mqtt';
import {create, useStore} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {useConfigStore} from './configStore';
import {
  Area,
  AreaType,
  LegacyArea,
  LegacyMapData,
  legacyMapSchema,
  mapDefaults,
  stateDefaults,
  stateSchema,
  type MapData,
  type State,
} from './schemas';

interface Mower {
  id: string;
  name: string;
  description: string;
  mqttClient: MqttClient;
  mqttPrefix: string;
  state: State;
  map: MapData;
}

interface MowersStore {
  mowers: Mower[];
  selected: number;
  loadMowers: () => void;
}

export const useMowersStore = create<MowersStore>()(
  immer((set, get) => ({
    mowers: [],
    selected: 0,
    loadMowers: () => {
      for (const oldMower of get().mowers) {
        oldMower.mqttClient.end();
      }

      const mowers: Mower[] = [];
      const mowerConfigs = useConfigStore.getState().config.mowers;
      const urls = [...new Set(mowerConfigs.map((config) => config.mqtt_ws_url))];
      for (const url of urls) {
        const urlObj = new URL(url);
        const client = mqtt.connect(url, {
          username: urlObj.username,
          password: urlObj.password,
          clean: true,
        });
        const clientMowers: {prefix: string; idx: number}[] = [];
        for (const config of mowerConfigs) {
          if (config.mqtt_ws_url === url) {
            const mower = {
              id: config.id,
              name: config.name,
              description: config.description,
              mqttClient: client,
              mqttPrefix: config.mqtt_prefix,
              state: stateDefaults,
              map: mapDefaults,
            };
            mowers.push(mower);
            clientMowers.push({prefix: mower.mqttPrefix, idx: mowers.length - 1});
          }
        }

        client.on('error', (error) => {
          // console.error('MQTT error', error.message);
        });

        client.on('connect', () => {
          console.log('connected');
          for (const clientMower of clientMowers) {
            client.subscribe(clientMower.prefix + 'robot_state/json');
            client.subscribe(clientMower.prefix + 'map/json');
          }
        });

        client.on('message', (topic, payload) => {
          const clientMower = clientMowers.find((clientMower) => topic.startsWith(clientMower.prefix));
          if (clientMower !== undefined) {
            const {idx, prefix} = clientMower;
            const partialTopic = topic.substring(prefix.length);
            if (partialTopic === 'robot_state/json') {
              set((state) => {
                state.mowers[idx].state = stateSchema.parse(JSON.parse(payload.toString()));
              });
            } else if (partialTopic === 'map/json') {
              set((state) => {
                const json = JSON.parse(payload.toString());
                state.mowers[idx].map = convertLegacyMap(legacyMapSchema.parse(json));
              });
            }
          }
        });
      }
      set({mowers, selected: 0});
    },
  })),
);

const convertLegacyMap = (legacy: LegacyMapData) => ({
  datum: legacy.datum,
  docking_pose: legacy.docking_pose,
  areas: [
    ...convertLegacyAreas(legacy.working_areas ?? [], 'mow', 'Working Area'),
    ...convertLegacyAreas(legacy.navigation_areas ?? [], 'nav', 'Navigation Area'),
  ],
  // TODO: Handle empty docking pose.
  docking_stations: [convertLegacyDockingStation(legacy.docking_pose)],
});

const convertLegacyAreas = (areas: LegacyArea[], type: AreaType, prefix: string): Area[] =>
  areas.flatMap((area, idx) => [
    {
      id: generateId(),
      properties: {
        name: area.name === '' ? `${prefix} ${idx}` : area.name,
        type: type,
        active: true,
      },
      outline: area.outline,
    },
    ...(area.obstacles ?? []).map((obstacle) => ({
      id: generateId(),
      properties: {
        name: 'Obstacle',
        type: 'obstacle' as const,
        active: true,
      },
      outline: obstacle,
    })),
  ]);

const convertLegacyDockingStation = (docking_pose: LegacyMapData['docking_pose']) => ({
  id: generateId(),
  properties: {
    name: 'Docking station',
    active: true,
  },
  position: {x: docking_pose.x, y: docking_pose.y},
  heading: docking_pose.heading,
});

export const useMowers = () => {
  // FIXME - this is a hack to get the mowers from the store
  const mowers = useMowersStore((s) => s.mowers);
  return mowers;
};

const identity = <T>(arg: T): T => arg;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSelectedMower<StateSlice>(selector: (state?: Mower) => StateSlice = identity as any) {
  return useStore(useMowersStore, (s) => selector(s.mowers[s.selected]));
}
