import type { DatabaseTypeIconProps } from './lib'
import { MySQLIcon } from './mysql-icon'
import { PostgreSQLIcon } from './postgresql-icon'
import { SQLiteIcon } from './sqlite-icon'

export function DatabaseTypeIcon({ driver, className }: DatabaseTypeIconProps) {
  if (driver === 'postgresql') {
    return <PostgreSQLIcon className={className} />
  }
  if (driver === 'sqlite') {
    return <SQLiteIcon className={className} />
  }

  return <MySQLIcon className={className} />
}
