export type CreateTableDriver = 'mysql' | 'postgresql' | 'sqlite'

export interface CreateTableColumnInput {
  name: string
  dataType: string
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
}

export interface CreateTableInput {
  connectionId: string
  database: string
  schema?: string
  tableName: string
  columns: CreateTableColumnInput[]
}

export interface CreateTableResult {
  tableName: string
}

export const CREATE_TABLE_DATA_TYPES: Record<CreateTableDriver, readonly string[]> = {
  mysql: [
    'INT',
    'BIGINT',
    'VARCHAR(255)',
    'TEXT',
    'BOOLEAN',
    'DECIMAL(10,2)',
    'DATE',
    'DATETIME',
    'TIMESTAMP',
    'JSON',
  ],
  postgresql: [
    'INTEGER',
    'BIGINT',
    'VARCHAR(255)',
    'TEXT',
    'BOOLEAN',
    'NUMERIC',
    'DATE',
    'TIMESTAMP',
    'TIMESTAMPTZ',
    'UUID',
    'JSONB',
  ],
  sqlite: ['INTEGER', 'TEXT', 'REAL', 'NUMERIC', 'BLOB'],
}

export function defaultCreateTableType(driver: CreateTableDriver): string {
  if (driver === 'mysql') return 'INT'
  return 'INTEGER'
}

export function supportsAutoIncrement(driver: CreateTableDriver, dataType: string): boolean {
  const normalized = dataType.toUpperCase()
  if (driver === 'mysql') return normalized === 'INT' || normalized === 'BIGINT'
  if (driver === 'postgresql') return normalized === 'INTEGER' || normalized === 'BIGINT'
  return normalized === 'INTEGER'
}
