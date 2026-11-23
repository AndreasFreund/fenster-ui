import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { shared } from './vite.config';

// The demo as one self-contained page: `npm run build:single` -> dist-single/index.html
export default defineConfig({ ...shared, plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single', emptyOutDir: true } });
