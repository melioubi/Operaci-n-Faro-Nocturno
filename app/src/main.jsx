import '@fontsource/chivo/latin-600.css';
import '@fontsource/chivo/latin-700.css';
import '@fontsource/chivo/latin-800.css';
import '@fontsource/chivo/latin-900.css';
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-500.css';
import '@fontsource/hanken-grotesk/latin-700.css';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource/chivo-mono/latin-400.css';
import '@fontsource/chivo-mono/latin-600.css';
import '@fontsource/chivo-mono/latin-800.css';
import './index.css';
import { createRoot } from 'react-dom/client';
import './engine/juego.js';            // arranca el motor del juego (Canvas 2D)
import App from './ui/App.jsx';
import './ui/pwa.js';

createRoot(document.getElementById('root')).render(<App />);

// App instalable + modo sin internet
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
