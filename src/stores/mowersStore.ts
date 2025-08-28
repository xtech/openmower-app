import mqtt, {MqttClient} from 'mqtt';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {useConfigStore} from './configStore';
import {mapDefaults, mapSchema, stateDefaults, stateSchema, type MapData, type State} from './schemas';

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
  loadMowers: () => void;
}

export const useMowersStore = create<MowersStore>()(
  immer((set, get) => ({
    mowers: [],
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
          console.error('MQTT error', error.message);
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
                state.mowers[idx].map = mapSchema.parse(JSON.parse(payload.toString()));
              });
            }
          }
        });
      }
      set({mowers});
    },
  })),
);

export const useMowers = () => {
  // FIXME - this is a hack to get the mowers from the store
  const mowers = useMowersStore((s) => s.mowers);
  return mowers;
};
