import type { DatabaseTypeIconProps } from './definitions/types'
import { MySQLIcon } from './mysql-icon/MySQLIcon'
import { PostgreSQLIcon } from './postgresql-icon/PostgreSQLIcon'
import { SQLiteIcon } from './sqlite-icon/SQLiteIcon'

export function DatabaseTypeIcon({ driver, className }: DatabaseTypeIconProps) {
  if (driver === 'postgresql') {
    return <PostgreSQLIcon className={className} />
  }
  if (driver === 'sqlite') {
    return <SQLiteIcon className={className} />
  }

  return <MySQLIcon className={className} />
}
