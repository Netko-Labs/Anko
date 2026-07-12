import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: '../domain/src/db/schema.ts',
  dialect: 'sqlite',
})
