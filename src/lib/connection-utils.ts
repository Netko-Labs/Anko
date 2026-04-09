import type { ConnectionConfig, DatabaseDriver } from '@/types'

/**
 * Parse connection URL like mysql://user:password@host:port/database, postgresql://..., or sqlite://path
 */
export function parseConnectionUrl(url: string): Partial<ConnectionConfig> | null {
  try {
    // SQLite: sqlite:///path/to/db or sqlite://:memory:
    const sqliteMatch = url.match(/^sqlite:\/\/(.+)$/i)
    if (sqliteMatch) {
      return {
        driver: 'sqlite',
        host: sqliteMatch[1],
        port: 0,
        username: '',
        password: '',
      }
    }

    // MySQL / PostgreSQL
    const urlMatch = url.match(
      /^(mysql|mysql2|postgresql|postgres):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:/]+)(?::(\d+))?(?:\/(.*))?$/i,
    )
    if (!urlMatch) return null

    const [, protocol, user, password, host, port, database] = urlMatch
    const driver: DatabaseDriver = protocol.toLowerCase().startsWith('mysql')
      ? 'mysql'
      : 'postgresql'
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
