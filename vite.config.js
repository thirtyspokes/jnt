import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so assets resolve correctly when served from a GitHub Pages
  // subpath (e.g. https://<user>.github.io/jnt/). Works because there is no
  // client-side (History API) routing.
  base: './',
  plugins: [react()],
})
