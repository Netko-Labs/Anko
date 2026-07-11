import { defineConfig } from 'mirinjs/config'

const mcpBridgeBinary = `build/sidecars/anko-mcp${process.platform === 'win32' ? '.exe' : ''}`

export default defineConfig({
  id: 'dev.netko.anko',
  name: 'Anko',
  publisher: 'Netko Labs',
  main: 'src/bun/index.ts',
  icon: 'icon.iconset',
  sidecars: {
    'anko-mcp': mcpBridgeBinary,
  },

  // Keep production bundles lean. Add locales here when Anko ships translations.
  cef: {
    locales: ['en-US'],
  },

  // Auto-updates from GitHub Releases. `mirin release` emits the artifacts;
  // the app polls .../releases/latest/download/stable-darwin-<arch>-update.json.
  release: {
    baseUrl: 'https://github.com/Netko-Labs/Anko/releases/latest/download',
    channel: 'stable',
  },

  // `mirin release` also emits a drag-to-Applications .dmg installer (signed +
  // notarized) alongside the updater artifacts. `true` uses the default layout.
  dmg: true,

  // Linux packaging (`mirin build --linux` / `mirin release`): AppImage + .deb +
  // .rpm. Metadata feeds the deb/rpm control fields and the .desktop entry.
  linux: {
    description: 'Cross-platform SQL database client for MySQL and PostgreSQL',
    homepage: 'https://github.com/Netko-Labs/Anko',
    category: 'Development',
  },

  windows: {
    // Opened manually from src/bun/index.ts so we can restore the saved frame.
    main: {
      title: 'Anko',
      width: 1280,
      height: 820,
      minWidth: 880,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      url: 'app://ui/index.html',
      show: 'ready',
      open: 'manual',
    },
  },
})
