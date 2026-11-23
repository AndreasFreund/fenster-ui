import { isAbsolute } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Library build: `npm run build`. Every package import stays external, so the app shares one copy of React and React Aria.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: (id) => !id.startsWith('.') && !isAbsolute(id) &&!id.startsWith('\0') },
  },
});
