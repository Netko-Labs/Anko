import { execSync } from 'node:child_process'
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { AppError } from '@anko/desktop-domain'

const KEY_SIZE = 32
const NONCE_SIZE = 12
const AUTH_TAG_SIZE = 16
const SALT = 'anko-sql-client-salt-v1-do-not-change'
const PBKDF2_ITERATIONS = 100_000

function getMachineId(): string {
  try {
    if (process.platform === 'darwin') {
      const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', {
        encoding: 'utf-8',
      })
      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)
      if (match) return match[1]
    } else if (process.platform === 'linux') {
      // readFileSync (not Bun.file().text(), which is async) — getMachineId is a
      // sync function feeding pbkdf2Sync; a Promise here throws "password must be
      // a string or buffer". /etc/machine-id has a trailing newline, so trim.
      return readFileSync('/etc/machine-id', 'utf-8').trim()
    } else if (process.platform === 'win32') {
      const output = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
        // windowsHide (CREATE_NO_WINDOW) stops a console window flashing on screen:
        // the app's host exe is GUI-subsystem, so spawning a console subprocess
        // would otherwise pop a brief terminal.
        { encoding: 'utf-8', windowsHide: true },
      )
      const match = output.match(/MachineGuid\s+REG_SZ\s+(.+)/)
      if (match) return match[1].trim()
    }
  } catch {
    // fallback
  }
  throw AppError.encryption('Failed to get machine ID')
}

function deriveKey(): Buffer {
  const machineId = getMachineId()
  return pbkdf2Sync(machineId, SALT, PBKDF2_ITERATIONS, KEY_SIZE, 'sha256')
}

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = deriveKey()
  }
  return cachedKey
}

export function encrypt(plaintext: string): Buffer {
  const key = getKey()
  const nonce = randomBytes(NONCE_SIZE)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: [nonce (12 bytes)][ciphertext][auth tag (16 bytes)]
  return Buffer.concat([nonce, encrypted, authTag])
}

export function decrypt(data: Buffer): string {
  if (data.length < NONCE_SIZE + AUTH_TAG_SIZE) {
    throw AppError.encryption('Data too short')
  }

  const key = getKey()
  const nonce = data.subarray(0, NONCE_SIZE)
  const authTag = data.subarray(data.length - AUTH_TAG_SIZE)
  const ciphertext = data.subarray(NONCE_SIZE, data.length - AUTH_TAG_SIZE)

  const decipher = createDecipheriv('aes-256-gcm', key, nonce)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf-8')
}
