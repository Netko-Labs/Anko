import { chmodSync, cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const exe = process.platform === 'win32' ? '.exe' : ''
const source = join(import.meta.dir, `../../mcp-bridge/dist/anko-mcp${exe}`)
const target = join(import.meta.dir, `../build/sidecars/anko-mcp${exe}`)

mkdirSync(dirname(target), { recursive: true })
cpSync(source, target)
if (!exe) chmodSync(target, 0o755)
console.log(`sidecar staged: ${target}`)
