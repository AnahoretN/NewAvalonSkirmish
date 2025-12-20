import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  if (command === 'build') {
    // Эта часть сработает при запуске 'npm run build'
    return {
      plugins: [react()],
      base: `/`, // Базовый путь для GitHub Pages
      build: {
        outDir: 'docs',      // Папка для GitHub Pages
      },
    }
  } else {
    // Эта часть сработает при запуске 'npm run dev' (локальная разработка)
    return {
      plugins: [react()],
      base: '/', // Локально работаем просто от корня localhost
    }
  }
})