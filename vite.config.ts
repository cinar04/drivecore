import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Build sonunda electron/oauth-config.json üretir, main.cjs bunu okur.
// Bu sayede VITE_GOOGLE_CLIENT_ID değeri Electron main process'e ulaşır
// (Vite sadece renderer için inject yapar, main.cjs'i görmez).
function electronOAuthConfigPlugin(env: Record<string, string>) {
  return {
    name: 'electron-oauth-config',
    closeBundle() {
      const config = {
        googleClientId: env.VITE_GOOGLE_CLIENT_ID || '',
      };
      writeFileSync(
        resolve(__dirname, 'electron/oauth-config.json'),
        JSON.stringify(config, null, 2)
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), electronOAuthConfigPlugin(env)],
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
})
