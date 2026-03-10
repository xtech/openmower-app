import type {MowerConfig} from '@/components/types';
import {OpenMowerRpc} from '@/lib/rpc';
import {generateId} from '@/utils/area-utils';
import {immerable} from 'immer';
import mqtt, {MqttClient} from 'mqtt';
import {create, useStore} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {useConfigStore} from './configStore';
import {
  Area,
  AreaType,
  capabilitiesSchema,
  LegacyArea,
  LegacyMapData,
  legacyMapSchema,
  mapDefaults,
  mapSchema,
  stateDefaults,
  stateSchema,
  type Capabilities,
  type MapData,
  type State,
} from './schemas';

export type MqttStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'offline';

class Mower {
  [immerable] = true;

  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly mqttUrl: string;
  readonly mqttClient: MqttClient;
  readonly mqttPrefix: string;
  readonly rpc: OpenMowerRpc;
  capabilities: Capabilities = {};
  state: State = stateDefaults;
  map: MapData = mapDefaults;

  constructor(config: MowerConfig, mqttClient: MqttClient) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.mqttUrl = config.mqtt_ws_url;
    this.mqttClient = mqttClient;
    this.mqttPrefix = config.mqtt_prefix;
    this.rpc = new OpenMowerRpc(mqttClient, config.mqtt_prefix);
  }

  hasCapability(capability: string, minLevel: number = 1): boolean {
    const level = this.capabilities[capability];
    return level !== undefined && level >= minLevel;
  }
}

interface MowersStore {
  mowers: Mower[];
  mqttStatuses: Record<string, MqttStatus>;
  selected: number;
  loadMowers: () => void;
}

export const useMowersStore = create<MowersStore>()(
  immer((set, get) => ({
    mowers: [],
    mqttStatuses: {},
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
            const mower = new Mower(config, client);
            mowers.push(mower);
            clientMowers.push({prefix: mower.mqttPrefix, idx: mowers.length - 1});
          }
        }

        const setMqttStatus = (status: MqttStatus) => {
          set((state) => {
            for (const clientMower of clientMowers) {
              state.mqttStatuses[mowers[clientMower.idx].id] = status;
            }
          });
        };

        client.on('error', () => {
          setMqttStatus('disconnected');
        });

        client.on('close', () => {
          setMqttStatus('disconnected');
        });

        client.on('offline', () => {
          setMqttStatus('offline');
        });

        client.on('reconnect', () => {
          setMqttStatus('reconnecting');
        });

        client.on('connect', () => {
          setMqttStatus('connected');
          for (const clientMower of clientMowers) {
            client.subscribe(clientMower.prefix + 'capabilities/json');
            client.subscribe(clientMower.prefix + 'robot_state/json');
            client.subscribe(clientMower.prefix + 'map/json');
            client.subscribe(clientMower.prefix + 'rpc/response');
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
                state.mowers[idx].map =
                  'areas' in json ? mapSchema.parse(json) : convertLegacyMap(legacyMapSchema.parse(json));
              });
            } else if (partialTopic === 'rpc/response') {
              mowers[idx].rpc._handleResponse(payload.toString());
            } else if (partialTopic === 'capabilities/json') {
              set((state) => {
                state.mowers[idx].capabilities = capabilitiesSchema.parse(JSON.parse(payload.toString()));
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
  areas: [
    ...convertLegacyAreas(legacy.working_areas ?? [], 'mow', 'Working Area'),
    ...convertLegacyAreas(legacy.navigation_areas ?? [], 'nav', 'Navigation Area'),
  ],
  docking_stations: legacy.docking_pose.heading === null ? [] : [convertLegacyDockingStation(legacy.docking_pose)],
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
  heading: docking_pose.heading!,
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
