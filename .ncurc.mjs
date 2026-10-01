import { defineConfig } from 'npm-check-updates';

export default defineConfig({
  // maplibre-react-components only supports maplibre-gl ^5, so stay within the major
  target: (name) => (name === 'maplibre-gl' ? 'minor' : 'latest'),
});
