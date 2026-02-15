import type { ConnectionConfig, DatabaseDriver } from '@/types'

/**
 * Parse connection URL like mysql://user:password@host:port/database or postgresql://...
 */
export function parseConnectionUrl(url: string): Partial<ConnectionConfig> | null {
  try {
    // Handle common URL formats
    const urlMatch = url.match(
      /^(mysql|postgresql|postgres):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:/]+)(?::(\d+))?(?:\/(.*))?$/i,
    )
    if (!urlMatch) return null

    const [, protocol, user, password, host, port, database] = urlMatch
    const driver: DatabaseDriver = protocol.toLowerCase() === 'mysql' ? 'mysql' : 'postgresql'
    const defaultPort = driver === 'mysql' ? 3306 : 5432

    return {
      driver,
      host: host || 'localhost',
      port: port ? Number.parseInt(port, 10) : defaultPort,
      username: user || (driver === 'mysql' ? 'root' : 'postgres'),
      password: password || '',
      database: database || '',
    }
  } catch {
    return null
  }
}
