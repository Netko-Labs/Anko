import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'Anko',
    identifier: 'com.anko.sql',
    version: '0.3.2',
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
      codesign: true,
      notarize: true,
    },
  },
  scripts: {
    postBuild: 'scripts/post-build.ts',
  },
  release: {
    baseUrl: 'https://github.com/Netko-Labs/Anko/releases/latest/download',
  },
} satisfies ElectrobunConfig
