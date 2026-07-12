import type { DatabaseDriver } from '@anko/desktop-domain'

export const DEFAULT_PORTS: Record<DatabaseDriver, number> = {
  mysql: 3306,
  postgresql: 5432,
  sqlite: 0,
}

export const DEFAULT_USERS: Record<DatabaseDriver, string> = {
  mysql: 'root',
  postgresql: 'postgres',
  sqlite: '',
}
