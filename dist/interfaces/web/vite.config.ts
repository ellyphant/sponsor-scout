import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Platform builds set MS_ASSET_BASE_URL to a release-addressed CDN origin so
  // asset URLs work on any host or mount path. Unset locally — builds at '/'.
  base: process.env.MS_ASSET_BASE_URL || '/',
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
});
