import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The framework is a workspace package; dedupe keeps one copy of React and React Aria.
export const shared = {
  base: './',
  resolve: { dedupe: ['react', 'react-dom', 'react-aria', 'react-aria-components', 'react-stately', '@internationalized/date'] },
};

// `npm run dev` / `npm run build` -> dist/
export default defineConfig({ ...shared, plugins: [react()] });
