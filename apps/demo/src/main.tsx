import { StrictMode } from 'react';
import '@andreasfreund/fenster-ui/style.css';
import '@andreasfreund/fenster-ui/fonts.css';
import './demo.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LabelsProvider, initAppearance } from '@andreasfreund/fenster-ui';
import { frameworkLabels } from './copy';

// Apply saved appearance before the first paint.
initAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LabelsProvider labels={frameworkLabels}>
      <App />
    </LabelsProvider>
  </StrictMode>
);
