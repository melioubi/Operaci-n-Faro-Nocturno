import { fileURLToPath } from 'node:url';

// La ruta al archivo de Tailwind es absoluta: así anda desde cualquier carpeta.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
