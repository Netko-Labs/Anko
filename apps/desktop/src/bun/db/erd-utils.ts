import type { ErdRelation, ErdSchema } from './connector'

/** Flat column row from a catalog query, before grouping into tables. */
export interface RawErdColumn {
  table: string
  name: string
  data_type: string
  nullable: boolean
  isPrimaryKey: boolean
  isUnique: boolean
  isAutoIncrement: boolean
  defaultValue?: string
}

/** Flat foreign-key row from a catalog query. */
export interface RawErdForeignKey {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  constraintName?: string
}

/**
 * Assemble an {@link ErdSchema} from the flat catalog rows every connector
 * produces: group columns by table (in `tableNames` order), flag the foreign-key
 * columns, and keep only relations whose both ends are tables in the set (drops
 * FKs pointing at tables outside the diagram's database/schema).
 */
export function assembleErdSchema(
  tableNames: string[],
  columns: RawErdColumn[],
  fks: RawErdForeignKey[],
): ErdSchema {
  const tableSet = new Set(tableNames)
  const fkColumnKeys = new Set(fks.map((fk) => `${fk.fromTable}.${fk.fromColumn}`))

  const columnsByTable = new Map<string, RawErdColumn[]>()
  for (const col of columns) {
    if (!tableSet.has(col.table)) continue
    const list = columnsByTable.get(col.table)
    if (list) list.push(col)
    else columnsByTable.set(col.table, [col])
  }

  const tables = tableNames.map((name) => ({
    name,
    columns: (columnsByTable.get(name) ?? []).map((c) => ({
      name: c.name,
      data_type: c.data_type,
      nullable: c.nullable,
      isPrimaryKey: c.isPrimaryKey,
      isForeignKey: fkColumnKeys.has(`${c.table}.${c.name}`),
      isUnique: c.isUnique,
      isAutoIncrement: c.isAutoIncrement,
      defaultValue: c.defaultValue,
    })),
  }))

  const relations: ErdRelation[] = fks
    .filter((fk) => tableSet.has(fk.fromTable) && tableSet.has(fk.toTable))
    .map((fk) => ({
      id: `${fk.fromTable}.${fk.fromColumn}->${fk.toTable}.${fk.toColumn}`,
      fromTable: fk.fromTable,
      fromColumn: fk.fromColumn,
      toTable: fk.toTable,
      toColumn: fk.toColumn,
      constraintName: fk.constraintName,
    }))

  return { tables, relations }
}
