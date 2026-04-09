import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'Anko',
    identifier: 'dev.netko.anko',
    version: '0.4.1',
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
    },
    views: {
      mainview: {
        entrypoint: 'dist/index.html',
      },
    },
    copy: {
      'dist/': 'views/mainview/',
      'src/native/libWindowDrag.dylib': 'native/libWindowDrag.dylib',
    },
    mac: {
      bundleCEF: true,
      codesign: true,
      notarize: true,
    },
    win: {
      bundleCEF: true,
    },
    linux: {
      bundleCEF: true,
    },
  },
  scripts: {
    postBuild: 'scripts/post-build.ts',
  },
  release: {
    baseUrl: 'https://github.com/Netko-Labs/Anko/releases/latest/download',
  },
} satisfies ElectrobunConfig
