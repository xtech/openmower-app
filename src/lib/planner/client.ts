// Studio connection to the planning service. Uses the generated
// OpenMowerRpc client (openrpc `ext.planner.plan`) over the app's standard
// JSON-RPC-over-MQTT transport, but on its own MQTT-over-WebSocket
// connection so it can target the planner broker independently of any
// mower, with a longer-than-default timeout (planning can exceed the 10s
// default; see rpc-base.ts, now configurable).

import mqtt, {MqttClient} from 'mqtt';
import {OpenMowerRpc} from '@/lib/rpc';
import type {PlannerPayload, PlannerSpec} from './types';

const PLAN_TIMEOUT_MS = 120000;

export class PlannerClient {
  private client: MqttClient;
  private rpc: OpenMowerRpc;
  public connected = false;

  constructor(url: string, prefix = '', onStatus?: (s: string) => void) {
    const respTopic = prefix + 'rpc/response';
    this.client = mqtt.connect(url, {clean: true, reconnectPeriod: 3000});
    this.rpc = new OpenMowerRpc(this.client, prefix, PLAN_TIMEOUT_MS);
    this.client.on('connect', () => {
      this.connected = true;
      onStatus?.('connected');
      this.client.subscribe(respTopic);
    });
    this.client.on('reconnect', () => onStatus?.('reconnecting'));
    this.client.on('close', () => {
      this.connected = false;
      onStatus?.('disconnected');
    });
    this.client.on('error', (e) => onStatus?.('error: ' + e.message));
    // route response frames into the generated client's pending-request map
    this.client.on('message', (topic, payload) => {
      if (topic === respTopic) this.rpc._handleResponse(payload.toString());
    });
  }

  async planCoverage(spec: PlannerSpec): Promise<PlannerPayload> {
    // spec {area, obstacles, nav_areas, params} maps 1:1 to the by-name
    // params of ext.planner.plan.
    const res = await this.rpc.ext.planner.plan(
      spec as unknown as Parameters<OpenMowerRpc['ext']['planner']['plan']>[0],
    );
    return res as unknown as PlannerPayload;
  }

  end() {
    this.client.end(true);
  }
}
