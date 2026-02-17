import { MySQLIcon } from './mysql-icon/MySQLIcon'
import { PostgreSQLIcon } from './postgresql-icon/PostgreSQLIcon'
import type { DatabaseTypeIconProps } from './definitions/types'

export function DatabaseTypeIcon({ driver, className }: DatabaseTypeIconProps) {
  if (driver === 'postgresql') {
    return <PostgreSQLIcon className={className} />
  }

  return <MySQLIcon className={className} />
}
