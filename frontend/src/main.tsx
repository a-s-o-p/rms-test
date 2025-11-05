
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RmsDataProvider } from './lib/rms-data';

createRoot(document.getElementById('root')!).render(
  <RmsDataProvider>
    <App />
  </RmsDataProvider>,
);
  