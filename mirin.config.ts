import { defineConfig } from 'mirinjs/config'

export default defineConfig({
  id: 'dev.netko.anko',
  name: 'Anko',
  main: 'src/bun/index.ts',
  icon: 'icon.iconset',

  windows: {
    // Opened manually from src/bun/index.ts so we can restore the saved frame.
    main: {
      title: 'Anko',
      width: 1280,
      height: 820,
      titleBarStyle: 'hiddenInset',
      url: 'app://ui/index.html',
      show: 'ready',
      open: 'manual',
    },
  },
})
