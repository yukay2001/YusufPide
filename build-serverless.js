import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bundle all backend code into a single file for Vercel
build({
  entryPoints: [join(__dirname, 'server/app.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(__dirname, 'api/_app.bundle.js'),
  external: [
    // Don't bundle node built-ins
    'fs', 'path', 'crypto', 'stream', 'http', 'https', 'zlib', 'url', 
    'querystring', 'net', 'tls', 'dns', 'events', 'util', 'buffer',
    // Externalize native dependencies
    'pg-native',
    'bcryptjs',
    'canvas',
    // Externalize Vite-related packages (not needed in serverless)
    'vite',
    'lightningcss',
    '@vitejs/plugin-react',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-dev-banner',
    '@replit/vite-plugin-runtime-error-modal',
    // Externalize Babel (Vite dependency)
    '@babel/core',
    '@babel/preset-typescript'
  ],
  minify: false,
  sourcemap: true,
  logLevel: 'info',
}).then(() => {
  console.log('✅ Backend bundled successfully for Vercel serverless!');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
