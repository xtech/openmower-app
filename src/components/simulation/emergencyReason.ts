// Decode the `emergency_reason` bitfield from the sim state into human labels.
// Mirrors the table in SIM_CONTROL_API.md.
const EMERGENCY_FLAGS: {bit: number; label: string}[] = [
  {bit: 1, label: 'Latch'},
  {bit: 2, label: 'Input timeout'},
  {bit: 4, label: 'Stop'},
  {bit: 8, label: 'Lift'},
  {bit: 16, label: 'Multi-lift'},
  {bit: 32, label: 'Collision'},
  {bit: 64, label: 'High-level timeout'},
  {bit: 128, label: 'High level'},
  {bit: 256, label: 'Service not ready'},
];

export function decodeEmergencyReasons(mask: number): string[] {
  return EMERGENCY_FLAGS.filter(({bit}) => (mask & bit) !== 0).map(({label}) => label);
}
