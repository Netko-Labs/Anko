import { defineConfig } from 'mirinjs/config'

export default defineConfig({
  id: 'dev.netko.anko',
  name: 'Anko',
  main: 'src/bun/index.ts',
  icon: 'icon.iconset',

  // Auto-updates from GitHub Releases. `mirin release` emits the artifacts;
  // the app polls .../releases/latest/download/stable-darwin-<arch>-update.json.
  release: {
    baseUrl: 'https://github.com/Netko-Labs/Anko/releases/latest/download',
    channel: 'stable',
  },

  // `mirin release` also emits a drag-to-Applications .dmg installer (signed +
  // notarized) alongside the updater artifacts. `true` uses the default layout.
  dmg: true,

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
