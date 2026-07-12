import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/bun/storage/drizzle',
  schema: './src/bun/storage/schema.ts',
  dialect: 'sqlite',
})
