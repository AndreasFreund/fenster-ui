import { StrictMode } from 'react';
import '@andreasfreund/fenster-ui/style.css';
import '@andreasfreund/fenster-ui/fonts.css';
import './demo.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ExampleApp } from './ExampleApp';
import { AppFrame, LabelsProvider, initAppearance } from '@andreasfreund/fenster-ui';
import { frameworkLabels } from './copy';

// Apply saved appearance before the first paint.
initAppearance();

// ?shot=light or ?shot=dark shows the picture for the README instead of the demo.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) document.documentElement.dataset.theme = shot === 'dark' ? 'dark' : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LabelsProvider labels={frameworkLabels}>
      {shot ? (
        <AppFrame>
          <ExampleApp />
          <div className="demo-shot" aria-hidden="true">fenster-ui</div>
        </AppFrame>
      ) : <App />}
    </LabelsProvider>
  </StrictMode>
);
