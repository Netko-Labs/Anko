import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'Anko',
    identifier: 'com.anko.sql',
    version: '0.3.0',
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
      codesign: false,
      notarize: false,
    },
  },
  release: {
    baseUrl: '',
  },
} satisfies ElectrobunConfig
