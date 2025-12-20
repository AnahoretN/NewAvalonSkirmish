import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig(({ command }: { command: string }) => {
  const baseConfig = {
    plugins: [react()],
    server: {
      host: true,
    },
    css: {
      devSourcemap: true,
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
  }

  if (command === 'build') {
    // Эта часть сработает при запуске 'npm run build'
    return {
      ...baseConfig,
      base: `/`, // Базовый путь для GitHub Pages
      build: {
        outDir: 'docs',      // Папка для GitHub Pages
        cssMinify: true,
      },
    }
  } else {
    // Эта часть сработает при запуске 'npm run dev' (локальная разработка)
    return {
      ...baseConfig,
      base: '/', // Локально работаем просто от корня localhost
    }
  }
})